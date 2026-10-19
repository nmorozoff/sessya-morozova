<?php
/**
 * Сторож формы — вызывать из планировщика Timeweb (curl/wget по URL).
 * Секрет: заголовок X-Morozova-Internal-Secret или ?secret= (как lookup-submissions).
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'no_config']);
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

require_once __DIR__ . '/morozova-health.php';
require_once __DIR__ . '/morozova-form-resilience.php';

$statePath = morozova_form_data_dir() . '/form-watch-state.json';
/** @var array<string, mixed> $state */
$state = [];
if (is_file($statePath)) {
    $decoded = json_decode((string) file_get_contents($statePath), true);
    if (is_array($decoded)) {
        $state = $decoded;
    }
}

$now = time();
$tz = new DateTimeZone('Europe/Moscow');
$nowMsk = new DateTimeImmutable('now', $tz);
$hourKey = $nowMsk->format('Y-m-d-H');
$dayKey = $nowMsk->format('Y-m-d');

$health = morozova_health_run($config);
$healthOk = $health['ok'];

$lastAlertHour = (string) ($state['last_alert_hour'] ?? '');
$wasDown = !empty($state['was_down']);
$sent = [];

if (!$healthOk) {
    if ($lastAlertHour !== $hourKey) {
        $failed = [];
        foreach ($health['checks'] as $c) {
            if (!$c['ok']) {
                $failed[] = $c['name'];
            }
        }
        morozova_form_max_ops_alert($config, 'health FAIL: ' . implode(', ', $failed));
        $state['last_alert_hour'] = $hourKey;
        $state['was_down'] = true;
        $sent[] = 'alert_down';
    }
} elseif ($wasDown) {
    if ($lastAlertHour !== $hourKey) {
        morozova_form_max_ops_alert($config, 'форма снова в норме (health OK)');
        $state['last_alert_hour'] = $hourKey;
        $state['was_down'] = false;
        $sent[] = 'alert_recovered';
    }
}

$lastDaily = (string) ($state['last_daily_report'] ?? '');
if ($nowMsk->format('H') === '21' && $lastDaily !== $dayKey) {
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
        $stats = morozova_health_submissions_last_24h($pdo);
        $n = $stats['count'];
        $text = "Форма жива, заявок за сутки: {$n}";
        if ($stats['zero_streak'] >= 3) {
            $text .= " (три дня подряд без заявок — проверьте форму и рекламу)";
        }
        morozova_form_max_ops_alert($config, $text);
        $state['last_daily_report'] = $dayKey;
        $sent[] = 'daily_report';
    } catch (Throwable $e) {
        morozova_form_log('error', 'daily_report_failed', ['error' => $e->getMessage()]);
    }
}

morozova_form_ensure_data_dir();
file_put_contents($statePath, json_encode($state, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

echo json_encode([
    'ok' => $healthOk,
    'health' => $health,
    'sent' => $sent,
    'ts' => date('c'),
], JSON_UNESCAPED_UNICODE);
