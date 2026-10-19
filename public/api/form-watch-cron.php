<?php
/**
 * Сторож формы — Timeweb cron:
 * - CLI: php /полный/путь/api/form-watch-cron.php (секрет не нужен, config.php рядом)
 * - HTTP: заголовок X-Morozova-Internal-Secret (hash_equals)
 */
declare(strict_types=1);

$isCli = php_sapi_name() === 'cli';

if (!$isCli) {
    header('Content-Type: application/json; charset=utf-8');
}

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    if (!$isCli) {
        http_response_code(503);
    }
    echo json_encode(['ok' => false, 'error' => 'no_config'], JSON_UNESCAPED_UNICODE) . ($isCli ? "\n" : '');
    exit(1);
}

$config = require $configPath;

if (!$isCli) {
    $secret = (string) ($config['internal_api_secret'] ?? '');
    $provided = (string) ($_SERVER['HTTP_X_MOROZOVA_INTERNAL_SECRET'] ?? '');
    if ($secret === '' || !hash_equals($secret, $provided)) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'forbidden'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

require_once __DIR__ . '/morozova-health.php';
require_once __DIR__ . '/morozova-form-resilience.php';

/**
 * @param array{ok: bool, checks: list<array<string, mixed>>} $health
 */
function morozova_form_watch_log_amocrm_failures(array $health, int $attempt): void
{
    foreach ($health['checks'] as $c) {
        if (($c['name'] ?? '') !== 'amocrm' || !empty($c['ok'])) {
            continue;
        }
        morozova_form_log('error', 'health_amocrm_fail', [
            'attempt' => $attempt,
            'detail' => trim((string) ($c['detail'] ?? '')),
            'http_status' => $c['http_status'] ?? null,
        ]);
    }
}

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
$healthRetried = false;

if (!$healthOk) {
    morozova_form_watch_log_amocrm_failures($health, 1);
    sleep(60);
    $health = morozova_health_run($config);
    $healthOk = $health['ok'];
    $healthRetried = true;
    if (!$healthOk) {
        morozova_form_watch_log_amocrm_failures($health, 2);
    }
}

$lastAlertHour = (string) ($state['last_alert_hour'] ?? '');
$wasDown = !empty($state['was_down']);
$sent = [];

if (!$healthOk) {
    if ($lastAlertHour !== $hourKey) {
        $failed = [];
        foreach ($health['checks'] as $c) {
            if (!$c['ok'] && ($c['alarm'] ?? true)) {
                $detail = trim((string) ($c['detail'] ?? ''));
                $failed[] = $detail !== '' ? $c['name'] . ': ' . $detail : $c['name'];
            }
        }
        if ($failed !== []) {
            morozova_form_max_ops_alert($config, 'health FAIL: ' . implode('; ', $failed));
        }
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
    'health_retried' => $healthRetried,
    'health' => $health,
    'sent' => $sent,
    'ts' => date('c'),
], JSON_UNESCAPED_UNICODE) . ($isCli ? "\n" : '');

exit($healthOk ? 0 : 1);
