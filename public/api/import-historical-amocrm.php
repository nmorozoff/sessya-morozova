<?php
/**
 * Одноразовый импорт исторических заявок из form_submissions → amoCRM.
 * Защита: заголовок X-Morozova-Internal-Secret = internal_api_secret из config.php
 *
 * GET ?dry_run=1  — только отчёт
 * GET ?dry_run=0  — импорт
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
$pipelineId = (int) (($config['amocrm']['pipeline_id'] ?? 0));
$statusId = (int) (($config['amocrm']['status_id'] ?? 0));

/**
 * @param array{name: string, contact: string, message: string|null} $row
 */
function morozova_import_is_test(array $row): bool
{
    $name = trim((string) ($row['name'] ?? ''));
    $contact = trim((string) ($row['contact'] ?? ''));
    $message = trim((string) ($row['message'] ?? ''));
    $nameHay = mb_strtolower($name);
    $contactHay = mb_strtolower($contact);
    $messageHay = mb_strtolower($message);

    if (preg_match('/^(тест|test|probe|demo|tiktoktest|проверка|sandbox)\b/ui', $nameHay)) {
        return true;
    }
    if (preg_match('/\b(crm\s*(fix|debug)|crm\s+fix\s+test|проверка\s+crm|wp\s+hub|hub\s+e2e|geotest|formfix)\b/ui', $nameHay)) {
        return true;
    }
    if (preg_match('/\b(e2e|formfixtest|geotest)\b/ui', $nameHay . ' ' . $contactHay)) {
        return true;
    }
    if (preg_match('/тест\s+(воронк|поля|wp|мессендж)/ui', $nameHay)) {
        return true;
    }
    if (preg_match('/^(тест|test)\s+(мессенджер|воронк|поля)/ui', $nameHay)) {
        return true;
    }

    if (preg_match('/natalya_test_user|wp_messenger_test|test_messenger|testuser/ui', $contactHay)) {
        return true;
    }
    if (preg_match('/^\+?7(900|901|999)123(45)?(67|88)?$/', preg_replace('/\D/', '', $contact))) {
        return true;
    }
    if (preg_match('/799900000\d{2}/', preg_replace('/\D/', '', $contact))) {
        return true;
    }

    if (preg_match('/^(тест|test|probe)\b/ui', $messageHay)) {
        return true;
    }
    if (preg_match('/test\s+messenger|anxiety request|проверка новой воронки|проверка поля/ui', $messageHay)) {
        return true;
    }

    if (preg_match('/^(аа|xxx)$/iu', $name)) {
        return true;
    }

    return false;
}

function morozova_import_fingerprint(string $name, string $contact): string
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

/**
 * @return array<string, true>
 */
function morozova_import_load_existing_fingerprints(array $amoConfig, int $pipelineId): array
{
    $seen = [];

    $page = 1;
    while (true) {
        $response = morozova_amocrm_api_request(
            $amoConfig,
            'GET',
            '/api/v4/contacts?limit=250&page=' . $page
        );
        if (!$response['ok']) {
            break;
        }
        $contacts = $response['data']['_embedded']['contacts'] ?? [];
        if (!is_array($contacts) || $contacts === []) {
            break;
        }
        foreach ($contacts as $contactData) {
            $phone = '';
            foreach ($contactData['custom_fields_values'] ?? [] as $field) {
                if (($field['field_code'] ?? '') === 'PHONE') {
                    $phone = (string) ($field['values'][0]['value'] ?? '');
                    break;
                }
            }
            $first = (string) ($contactData['first_name'] ?? '');
            $last = (string) ($contactData['last_name'] ?? '');
            $fullName = trim($first . ' ' . $last);
            $seen[morozova_import_fingerprint($fullName, $phone)] = true;
        }
        if (count($contacts) < 250) {
            break;
        }
        $page++;
        if ($page > 40) {
            break;
        }
    }

    $page = 1;
    while (true) {
        $path = '/api/v4/leads?limit=250&page=' . $page . '&with=contacts';
        if ($pipelineId > 0) {
            $path .= '&filter[pipeline_id]=' . $pipelineId;
        }
        $response = morozova_amocrm_api_request($amoConfig, 'GET', $path);
        if (!$response['ok']) {
            break;
        }
        $leads = $response['data']['_embedded']['leads'] ?? [];
        if (!is_array($leads) || $leads === []) {
            break;
        }
        foreach ($leads as $lead) {
            $leadName = (string) ($lead['name'] ?? '');
            $name = preg_replace('/^Заявка:\s*/u', '', $leadName);
            $name = trim((string) preg_replace('/\s*\([^)]+\)\s*$/u', '', (string) $name));
            $telegram = '';
            foreach ($lead['custom_fields_values'] ?? [] as $field) {
                $code = (string) ($field['field_code'] ?? '');
                if ($code === 'TELEGRAM_USERNAME') {
                    $telegram = (string) ($field['values'][0]['value'] ?? '');
                }
            }
            if ($telegram !== '') {
                $seen[morozova_import_fingerprint($name, $telegram)] = true;
            }
            if ($name !== '') {
                $seen[morozova_import_fingerprint($name, '')] = true;
            }
        }
        if (count($leads) < 250) {
            break;
        }
        $page++;
        if ($page > 40) {
            break;
        }
    }

    return $seen;
}

function morozova_import_lead_source(string $utmSource): string
{
    $key = strtolower(trim($utmSource));
    if ($key === '' || $key === 'direct') {
        return 'Сайт';
    }
    if (str_starts_with($key, 'ig') || str_contains($key, 'insta')) {
        return 'Instagram';
    }
    if (str_starts_with($key, 'tt') || str_contains($key, 'tiktok')) {
        return 'TikTok';
    }
    if (str_starts_with($key, 'vk')) {
        return 'VK';
    }
    if (str_starts_with($key, 'tg')) {
        return 'Telegram';
    }
    return 'Сайт';
}

try {
    $pdo = new PDO(
        sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $config['db_host'],
            $config['db_port'] ?? '3306',
            $config['db_name']
        ),
        $config['db_user'],
        $config['db_pass'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    $rows = $pdo->query(
        'SELECT id, name, contact, message, utm_source, utm_campaign, utm_medium, landing_path, created_at
         FROM form_submissions
         ORDER BY created_at ASC'
    )->fetchAll();

    $amoConfig = is_array($config['amocrm'] ?? null) ? $config['amocrm'] : [];
    if (empty($amoConfig['enabled'])) {
        throw new RuntimeException('amocrm disabled in config');
    }

    $existing = morozova_import_load_existing_fingerprints($amoConfig, $pipelineId);

    $report = [
        'ok' => true,
        'dry_run' => $dryRun,
        'total_in_db' => count($rows),
        'skipped_test' => 0,
        'skipped_duplicate' => 0,
        'skipped_invalid' => 0,
        'imported' => 0,
        'failed' => 0,
        'samples' => [],
        'errors' => [],
        'skipped_test_samples' => [],
    ];

    foreach ($rows as $row) {
        $name = trim((string) ($row['name'] ?? ''));
        $contact = trim((string) ($row['contact'] ?? ''));
        if ($name === '' || $contact === '') {
            $report['skipped_invalid']++;
            continue;
        }
        if (morozova_import_is_test($row)) {
            $report['skipped_test']++;
            if ($verbose && count($report['skipped_test_samples']) < 30) {
                $report['skipped_test_samples'][] = [
                    'id' => (int) $row['id'],
                    'name' => $name,
                    'contact' => $contact,
                ];
            }
            continue;
        }

        $fp = morozova_import_fingerprint($name, $contact);
        if (isset($existing[$fp])) {
            $report['skipped_duplicate']++;
            continue;
        }

        $metadata = [];
        $utmSource = trim((string) ($row['utm_source'] ?? ''));
        if ($utmSource !== '') {
            $metadata[] = 'utm_source: ' . $utmSource;
        }
        $utmCampaign = trim((string) ($row['utm_campaign'] ?? ''));
        if ($utmCampaign !== '') {
            $metadata[] = 'utm_campaign: ' . $utmCampaign;
        }
        $utmMedium = trim((string) ($row['utm_medium'] ?? ''));
        if ($utmMedium !== '') {
            $metadata[] = 'utm_medium: ' . $utmMedium;
        }
        $landing = trim((string) ($row['landing_path'] ?? ''));
        if ($landing !== '') {
            $metadata[] = 'landing: ' . $landing;
        }
        $createdAt = trim((string) ($row['created_at'] ?? ''));
        if ($createdAt !== '') {
            $metadata[] = 'Заявка от: ' . $createdAt;
        }

        $payload = [
            'name' => $name,
            'contact' => $contact,
            'message' => trim((string) ($row['message'] ?? '')),
            'metadata' => $metadata,
            'source_site' => 'morozovanatalia.ru',
            'lead_source' => morozova_import_lead_source($utmSource),
            'preferred_channel' => null,
            'utm_source' => $utmSource !== '' ? $utmSource : null,
            'utm_medium' => $utmMedium !== '' ? $utmMedium : null,
            'utm_campaign' => $utmCampaign !== '' ? $utmCampaign : null,
            'traffic_source_label' => $utmSource !== '' ? morozova_amocrm_source_label($utmSource) : 'Прямой заход',
            'traffic_account' => $utmSource !== '' ? morozova_amocrm_utm_meta($utmSource)['account'] : '',
        ];

        if (count($report['samples']) < 5) {
            $report['samples'][] = [
                'id' => (int) $row['id'],
                'name' => $name,
                'contact' => $contact,
                'created_at' => $createdAt,
            ];
        }

        if ($dryRun) {
            $report['imported']++;
            $existing[$fp] = true;
            continue;
        }

        $ok = morozova_amocrm_send_lead($amoConfig, $payload);
        if ($ok) {
            $report['imported']++;
            $existing[$fp] = true;
            usleep(150000);
        } else {
            $report['failed']++;
            if (count($report['errors']) < 20) {
                $report['errors'][] = ['id' => (int) $row['id'], 'name' => $name];
            }
        }
    }

    echo json_encode($report, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
