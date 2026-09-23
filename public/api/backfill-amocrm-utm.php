<?php
/**
 * Заполняет поля источника/UTM у уже созданных сделок в amoCRM
 * по данным form_submissions (телефон / telegram / имя из заголовка сделки).
 *
 * GET ?dry_run=1 — отчёт
 * GET ?dry_run=0 — PATCH сделок
 * GET ?verbose=1 — детали по каждой сделке
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'config missing']);
    exit;
}

$config = require $configPath;
$secret = trim((string) ($config['internal_api_secret'] ?? ''));
$provided = trim((string) ($_SERVER['HTTP_X_MOROZOVA_INTERNAL_SECRET'] ?? $_GET['secret'] ?? ''));

if ($secret === '' || $provided !== $secret) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'forbidden']);
    exit;
}

require_once __DIR__ . '/crm-webhook.php';
require_once __DIR__ . '/morozova-amocrm.php';

$dryRun = !isset($_GET['dry_run']) || $_GET['dry_run'] !== '0';
$verbose = isset($_GET['verbose']) && $_GET['verbose'] === '1';
$amoConfig = $config['amocrm'] ?? [];
$pipelineId = (int) ($amoConfig['pipeline_id'] ?? 0);

function morozova_backfill_fingerprint(string $name, string $contact): string
{
    $parts = morozova_crm_parse_contact($contact);
    $digits = preg_replace('/\D/', '', $parts['phone']);
    if (strlen($digits) >= 10) {
        return 'phone:' . substr($digits, -10);
    }

    $tg = trim($parts['telegramNickname']);
    if ($tg !== '') {
        $tg = ltrim($tg, '@');
        return 'tg:' . mb_strtolower($tg);
    }

    $email = mb_strtolower(trim($contact));
    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return 'email:' . $email;
    }

    $normName = mb_strtolower(preg_replace('/\s+/u', ' ', trim($name)));
    $normContact = mb_strtolower(preg_replace('/\s+/u', ' ', trim($contact)));

    return 'raw:' . md5($normName . '|' . $normContact);
}

function morozova_backfill_norm_name(string $name): string
{
    $name = mb_strtolower(trim(preg_replace('/\s+/u', ' ', $name) ?? ''));
    if ($name === '') {
        return '';
    }
    $parts = preg_split('/\s+/u', $name, 2) ?: [];
    return $parts[0] ?? $name;
}

function morozova_backfill_extract_lead_client_name(string $leadTitle): string
{
    if (preg_match('/Заявка:\s*(.+?)\s*\(/u', $leadTitle, $m)) {
        return trim($m[1]);
    }
    if (preg_match('/Заявка:\s*(.+)$/u', $leadTitle, $m)) {
        return trim($m[1]);
    }
    return '';
}

/**
 * @return array{
 *   by_fp: array<string, array{utm_source: string, utm_medium: string, utm_campaign: string, name: string, contact: string}>,
 *   by_phone10: array<string, array{utm_source: string, utm_medium: string, utm_campaign: string, name: string, contact: string}>,
 *   by_first_name: array<string, list<array{utm_source: string, utm_medium: string, utm_campaign: string, name: string, contact: string}>>
 * }
 */
function morozova_backfill_load_submission_indexes(PDO $pdo): array
{
    $stmt = $pdo->query(
        'SELECT name, contact, utm_source, utm_campaign, utm_medium
         FROM form_submissions
         ORDER BY id ASC'
    );

    $byFp = [];
    $byPhone10 = [];
    $byFirstName = [];

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $name = trim((string) ($row['name'] ?? ''));
        $contact = trim((string) ($row['contact'] ?? ''));
        if ($name === '' && $contact === '') {
            continue;
        }

        $entry = [
            'utm_source' => trim((string) ($row['utm_source'] ?? '')),
            'utm_medium' => trim((string) ($row['utm_medium'] ?? '')),
            'utm_campaign' => trim((string) ($row['utm_campaign'] ?? '')),
            'name' => $name,
            'contact' => $contact,
        ];

        $fp = morozova_backfill_fingerprint($name, $contact);
        $byFp[$fp] = $entry;

        $parts = morozova_crm_parse_contact($contact);
        $digits = preg_replace('/\D/', '', $parts['phone']);
        if (strlen($digits) >= 10) {
            $byPhone10[substr($digits, -10)] = $entry;
        }

        $first = morozova_backfill_norm_name($name);
        if ($first !== '') {
            if (!isset($byFirstName[$first])) {
                $byFirstName[$first] = [];
            }
            $byFirstName[$first][] = $entry;
        }
    }

    return [
        'by_fp' => $byFp,
        'by_phone10' => $byPhone10,
        'by_first_name' => $byFirstName,
    ];
}

/**
 * @param array{by_fp: array, by_phone10: array, by_first_name: array} $indexes
 * @return array{utm_source: string, utm_medium: string, utm_campaign: string, match: string}|null
 */
function morozova_backfill_match_submission(array $indexes, string $clientName, string $contactStr): ?array
{
    if ($clientName !== '' && $contactStr !== '') {
        $fp = morozova_backfill_fingerprint($clientName, $contactStr);
        if (isset($indexes['by_fp'][$fp])) {
            $hit = $indexes['by_fp'][$fp];
            return [
                'utm_source' => $hit['utm_source'],
                'utm_medium' => $hit['utm_medium'],
                'utm_campaign' => $hit['utm_campaign'],
                'match' => 'fingerprint',
            ];
        }
    }

    $parts = morozova_crm_parse_contact($contactStr);
    $digits = preg_replace('/\D/', '', $parts['phone']);
    if (strlen($digits) >= 10) {
        $phone10 = substr($digits, -10);
        if (isset($indexes['by_phone10'][$phone10])) {
            $hit = $indexes['by_phone10'][$phone10];
            return [
                'utm_source' => $hit['utm_source'],
                'utm_medium' => $hit['utm_medium'],
                'utm_campaign' => $hit['utm_campaign'],
                'match' => 'phone10',
            ];
        }
    }

    $tg = ltrim(trim($parts['telegramNickname']), '@');
    if ($tg !== '') {
        $tgKey = 'tg:' . mb_strtolower($tg);
        if (isset($indexes['by_fp'][$tgKey])) {
            $hit = $indexes['by_fp'][$tgKey];
            return [
                'utm_source' => $hit['utm_source'],
                'utm_medium' => $hit['utm_medium'],
                'utm_campaign' => $hit['utm_campaign'],
                'match' => 'telegram',
            ];
        }
    }

    $first = morozova_backfill_norm_name($clientName);
    if ($first !== '' && isset($indexes['by_first_name'][$first])) {
        $candidates = $indexes['by_first_name'][$first];
        if (count($candidates) === 1) {
            $hit = $candidates[0];
            return [
                'utm_source' => $hit['utm_source'],
                'utm_medium' => $hit['utm_medium'],
                'utm_campaign' => $hit['utm_campaign'],
                'match' => 'first_name_unique',
            ];
        }

        if ($contactStr !== '') {
            foreach ($candidates as $hit) {
                $hitParts = morozova_crm_parse_contact($hit['contact']);
                $hitDigits = preg_replace('/\D/', '', $hitParts['phone']);
                if (strlen($digits) >= 10 && strlen($hitDigits) >= 10 && substr($digits, -10) === substr($hitDigits, -10)) {
                    return [
                        'utm_source' => $hit['utm_source'],
                        'utm_medium' => $hit['utm_medium'],
                        'utm_campaign' => $hit['utm_campaign'],
                        'match' => 'first_name+phone',
                    ];
                }
            }
        }

        foreach ($candidates as $hit) {
            if ($hit['utm_source'] !== '') {
                return [
                    'utm_source' => $hit['utm_source'],
                    'utm_medium' => $hit['utm_medium'],
                    'utm_campaign' => $hit['utm_campaign'],
                    'match' => 'first_name_with_utm',
                ];
            }
        }
    }

    return null;
}

/**
 * @return array{phone: string, telegram: string, display_name: string}
 */
function morozova_backfill_fetch_contact_details(array $config, int $contactId): array
{
    $resp = morozova_amocrm_api_request($config, 'GET', '/api/v4/contacts/' . $contactId);
    if (!$resp['ok'] || !is_array($resp['data'])) {
        return ['phone' => '', 'telegram' => '', 'display_name' => ''];
    }

    $contactData = $resp['data'];
    $phone = '';
    $telegram = '';
    $cf = $contactData['custom_fields_values'] ?? [];
    if (is_array($cf)) {
        foreach ($cf as $field) {
            $code = (string) ($field['field_code'] ?? '');
            $val = trim((string) ($field['values'][0]['value'] ?? ''));
            if ($val === '') {
                continue;
            }
            if ($code === 'PHONE' && $phone === '') {
                $phone = $val;
            }
            if (($code === 'EMAIL' || str_contains(mb_strtolower((string) ($field['field_name'] ?? '')), 'telegram')) && $telegram === '') {
                if (str_contains($val, '@') || str_contains(mb_strtolower($val), 't.me')) {
                    $telegram = $val;
                }
            }
        }
    }

    $first = trim((string) ($contactData['first_name'] ?? ''));
    $last = trim((string) ($contactData['last_name'] ?? ''));
    $displayName = trim($first . ' ' . $last);

    return [
        'phone' => $phone,
        'telegram' => $telegram,
        'display_name' => $displayName,
    ];
}

/**
 * @param array<string, mixed> $config
 * @return list<array{id: int, title: string, client_name: string, contact_str: string}>
 */
function morozova_backfill_fetch_pipeline_leads(array $config, int $pipelineId): array
{
    $leads = [];
    $page = 1;
    do {
        $path = '/api/v4/leads?limit=50&page=' . $page . '&with=contacts';
        if ($pipelineId > 0) {
            $path .= '&filter[pipeline_id]=' . $pipelineId;
        }
        $resp = morozova_amocrm_api_request($config, 'GET', $path);
        if (!$resp['ok'] || !is_array($resp['data'])) {
            break;
        }
        $embedded = $resp['data']['_embedded']['leads'] ?? [];
        if (!is_array($embedded) || $embedded === []) {
            break;
        }
        foreach ($embedded as $lead) {
            $leadId = (int) ($lead['id'] ?? 0);
            if ($leadId <= 0) {
                continue;
            }

            $title = (string) ($lead['name'] ?? '');
            $clientName = morozova_backfill_extract_lead_client_name($title);
            $contactStr = '';

            $contacts = $lead['_embedded']['contacts'] ?? [];
            if (is_array($contacts) && !empty($contacts[0]['id'])) {
                $details = morozova_backfill_fetch_contact_details($config, (int) $contacts[0]['id']);
                $contactStr = $details['phone'] !== '' ? $details['phone'] : $details['telegram'];
                if ($clientName === '' && $details['display_name'] !== '') {
                    $clientName = $details['display_name'];
                }
                usleep(100000);
            }

            $leads[] = [
                'id' => $leadId,
                'title' => $title,
                'client_name' => $clientName,
                'contact_str' => $contactStr,
            ];
        }
        $page++;
        usleep(200000);
    } while (count($embedded) >= 50);

    return $leads;
}

/**
 * @param array<string, mixed> $config
 * @param array{utm_source: string, utm_medium: string, utm_campaign: string} $utm
 */
function morozova_backfill_build_patch(array $config, array $utm): array
{
    $utmSource = $utm['utm_source'];
    $utmMedium = $utm['utm_medium'];
    $utmCampaign = $utm['utm_campaign'];
    $meta = morozova_amocrm_utm_meta($utmSource);
    $trafficLabel = $utmSource !== '' ? morozova_amocrm_source_label($utmSource) : 'Прямой заход';
    $trafficAccount = $meta['account'];

    $payload = ['custom_fields_values' => []];

    $set = static function (array &$p, int $fieldId, string $value): void {
        $value = trim($value);
        if ($value === '' || $fieldId <= 0) {
            return;
        }
        $p['custom_fields_values'][] = [
            'field_id' => $fieldId,
            'values' => [['value' => $value]],
        ];
    };

    $set($payload, (int) ($config['traffic_source_field_id'] ?? 0), $trafficLabel);
    $set($payload, (int) ($config['utm_code_field_id'] ?? 0), $utmSource !== '' ? $utmSource : 'direct');
    $set($payload, (int) ($config['utm_campaign_field_id'] ?? 0), $utmCampaign);
    $set($payload, (int) ($config['utm_medium_field_id'] ?? 0), $utmMedium);
    $set($payload, (int) ($config['traffic_account_field_id'] ?? 0), $trafficAccount);

    if ($utmSource !== '') {
        $payload['custom_fields_values'][] = [
            'field_code' => 'UTM_SOURCE',
            'values' => [['value' => $utmSource]],
        ];
    }
    if ($utmMedium !== '') {
        $payload['custom_fields_values'][] = [
            'field_code' => 'UTM_MEDIUM',
            'values' => [['value' => $utmMedium]],
        ];
    }
    if ($utmCampaign !== '') {
        $payload['custom_fields_values'][] = [
            'field_code' => 'UTM_CAMPAIGN',
            'values' => [['value' => $utmCampaign]],
        ];
    }

    return $payload;
}

try {
    $pdo = new PDO(
        sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $config['db_host'] ?? 'localhost',
            $config['db_port'] ?? '3306',
            $config['db_name'] ?? ''
        ),
        $config['db_user'] ?? '',
        $config['db_pass'] ?? '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $indexes = morozova_backfill_load_submission_indexes($pdo);
    $leads = morozova_backfill_fetch_pipeline_leads($amoConfig, $pipelineId);

    $report = [
        'dry_run' => $dryRun,
        'submissions_total' => count($indexes['by_fp']),
        'submissions_with_utm' => count(array_filter($indexes['by_fp'], static fn (array $r): bool => $r['utm_source'] !== '')),
        'pipeline_leads' => count($leads),
        'matched' => 0,
        'updated' => 0,
        'skipped_no_match' => 0,
        'failed' => 0,
        'details' => [],
    ];

    foreach ($leads as $lead) {
        $match = morozova_backfill_match_submission($indexes, $lead['client_name'], $lead['contact_str']);

        $detail = [
            'lead_id' => $lead['id'],
            'lead_title' => $lead['title'],
            'client_name' => $lead['client_name'],
            'contact' => $lead['contact_str'],
            'match' => $match['match'] ?? null,
            'utm_source' => $match['utm_source'] ?? null,
        ];

        if ($match === null) {
            $report['skipped_no_match']++;
            if ($verbose) {
                $report['details'][] = $detail;
            }
            continue;
        }

        $report['matched']++;
        $patch = morozova_backfill_build_patch($amoConfig, $match);
        $detail['traffic_label'] = morozova_amocrm_source_label($match['utm_source'] !== '' ? $match['utm_source'] : 'direct');
        if ($verbose || count($report['details']) < 12) {
            $report['details'][] = $detail;
        }

        if ($dryRun) {
            $report['updated']++;
            continue;
        }

        $resp = morozova_amocrm_api_request(
            $amoConfig,
            'PATCH',
            '/api/v4/leads/' . $lead['id'],
            $patch
        );
        if ($resp['ok']) {
            $report['updated']++;
            usleep(150000);
        } else {
            $report['failed']++;
            $detail['error'] = $resp['error'] ?? 'patch failed';
        }
    }

    if (!$verbose && isset($report['details']) && count($report['details']) > 12) {
        $report['details'] = array_slice($report['details'], 0, 12);
    }

    echo json_encode(['ok' => true, 'report' => $report], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
