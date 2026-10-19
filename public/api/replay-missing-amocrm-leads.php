<?php
/**
 * Досоздание сделок amo для заявок из БД (после сбоя CRM).
 * POST + X-Morozova-Internal-Secret. JSON: { "since_hours": 8, "dry_run": false }
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

$config = require __DIR__ . '/config.php';
$secret = (string) ($config['internal_api_secret'] ?? '');
$provided = (string) ($_SERVER['HTTP_X_MOROZOVA_INTERNAL_SECRET'] ?? '');
if ($secret === '' || !hash_equals($secret, $provided)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'forbidden']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
$sinceHours = is_array($data) ? max(1, min(72, (int) ($data['since_hours'] ?? 8))) : 8;
$dryRun = is_array($data) && !empty($data['dry_run']);

require_once __DIR__ . '/morozova-amocrm.php';

function morozova_replay_lead_source(string $utmSource): string
{
    $key = strtolower(trim($utmSource));
    if ($key === '' || $key === 'direct') {
        return 'Сайт';
    }
    if ($key === 'max') {
        return 'Канал Max';
    }
    if (str_starts_with($key, 'vk')) {
        return 'ВК';
    }
    if (str_starts_with($key, 'tg')) {
        return 'ТГ';
    }
    return 'Сайт';
}

function morozova_replay_wants_trial(string $message): bool
{
    return str_contains($message, 'Записаться на бесплатную пробную сессию');
}

$amoConfig = is_array($config['amocrm'] ?? null) ? $config['amocrm'] : [];
if (empty($amoConfig['enabled'])) {
    echo json_encode(['ok' => false, 'error' => 'amocrm_disabled'], JSON_UNESCAPED_UNICODE);
    exit;
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
    $stmt = $pdo->prepare(
        "SELECT id, name, contact, message, utm_source, utm_campaign, utm_medium, landing_path, referrer, visitor_geo, created_at
         FROM form_submissions
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL :hours HOUR)
           AND name NOT LIKE 'Тест smoke%'
           AND name NOT LIKE 'Тест %'
           AND name NOT IN ('x', 'тест')
         ORDER BY id ASC"
    );
    $stmt->execute([':hours' => $sinceHours]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $results = [];
    foreach ($rows as $row) {
        $message = trim((string) ($row['message'] ?? ''));
        $utmSource = trim((string) ($row['utm_source'] ?? ''));
        $payload = [
            'name' => (string) $row['name'],
            'contact' => (string) $row['contact'],
            'message' => $message,
            'metadata' => ['replay_from_submission_id' => (int) $row['id']],
            'source_site' => (string) ($config['site_domain'] ?? 'morozovanatalia.ru'),
            'lead_source' => morozova_replay_lead_source($utmSource),
            'utm_source' => $utmSource !== '' ? $utmSource : null,
            'utm_medium' => $row['utm_medium'] ?? null,
            'utm_campaign' => $row['utm_campaign'] ?? null,
            'visitor_geo' => $row['visitor_geo'] ?? null,
            'wants_trial_session' => morozova_replay_wants_trial($message),
        ];
        if ($dryRun) {
            $results[] = ['id' => (int) $row['id'], 'dry_run' => true];
            continue;
        }
        $ok = morozova_amocrm_send_lead($amoConfig, $payload);
        $results[] = [
            'id' => (int) $row['id'],
            'created' => $ok,
            'amo_lead_id' => $GLOBALS['morozova_amocrm_last_lead_id'] ?? null,
            'error' => $ok ? null : ($GLOBALS['morozova_amocrm_last_error'] ?? ''),
        ];
    }

    echo json_encode([
        'ok' => true,
        'since_hours' => $sinceHours,
        'processed' => count($results),
        'results' => $results,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error'], JSON_UNESCAPED_UNICODE);
}
