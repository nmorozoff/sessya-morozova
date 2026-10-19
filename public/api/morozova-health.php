<?php
declare(strict_types=1);

/**
 * Общие проверки для health.php и form-watch-cron.php.
 *
 * @return list<array{name: string, ok: bool, detail: string}>
 */
function morozova_health_required_php_files(): array
{
    return [
        'send-form.php',
        'morozova-form-resilience.php',
        'morozova-amocrm.php',
        'morozova-reels-lead.php',
        'morozova-traffic-source.php',
        'morozova-visitor-geo.php',
        'max-notify.php',
        'health.php',
        'form-watch-cron.php',
        'lookup-submissions.php',
        'delete-submission.php',
    ];
}

/**
 * @return array{ok: bool, checks: list<array{name: string, ok: bool, detail: string}>}
 */
function morozova_health_run(array $config): array
{
    $checks = [];

    foreach (morozova_health_required_php_files() as $file) {
        $path = __DIR__ . '/' . $file;
        $checks[] = [
            'name' => 'file:' . $file,
            'ok' => is_file($path),
            'detail' => is_file($path) ? 'present' : 'missing',
        ];
    }

    $configPath = __DIR__ . '/config.php';
    $checks[] = [
        'name' => 'config',
        'ok' => is_file($configPath),
        'detail' => is_file($configPath) ? 'readable' : 'missing',
    ];

    $dbOk = false;
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
        $pdo->query('SELECT 1');
        $dbOk = true;
        $dbDetail = 'connected';
    } catch (Throwable $e) {
        $dbDetail = 'error';
    }
    $checks[] = ['name' => 'database', 'ok' => $dbOk, 'detail' => $dbDetail];

    $amoOk = false;
    $amoDetail = 'disabled';
    $amoConfig = is_array($config['amocrm'] ?? null) ? $config['amocrm'] : [];
    if (!empty($amoConfig['enabled'])) {
        if (is_file(__DIR__ . '/morozova-amocrm.php')) {
            require_once __DIR__ . '/morozova-amocrm.php';
            $resp = morozova_amocrm_api_request($amoConfig, 'GET', '/api/v4/account');
            $amoOk = !empty($resp['ok']);
            $amoDetail = $amoOk ? 'token_ok' : 'token_or_api_fail';
        } else {
            $amoDetail = 'module_missing';
        }
    }
    $checks[] = ['name' => 'amocrm', 'ok' => $amoOk || $amoDetail === 'disabled', 'detail' => $amoDetail];

    $maxOk = false;
    $maxDetail = 'not_configured';
    if (is_file(__DIR__ . '/max-notify.php')) {
        require_once __DIR__ . '/max-notify.php';
        $maxCfg = morozova_max_load_config($config);
        if (!empty($maxCfg['enabled']) && trim((string) ($maxCfg['bot_token'] ?? '')) !== '') {
            $maxOk = true;
            $maxDetail = 'configured';
        } else {
            $maxDetail = 'disabled_or_empty_token';
        }
    }
    $checks[] = [
        'name' => 'max_notify',
        'ok' => $maxOk,
        'detail' => $maxDetail,
    ];

    $backupDir = __DIR__ . '/data';
    $checks[] = [
        'name' => 'backup_dir',
        'ok' => is_dir($backupDir) && is_writable($backupDir),
        'detail' => is_dir($backupDir) ? (is_writable($backupDir) ? 'writable' : 'not_writable') : 'missing',
    ];

    $allOk = true;
    foreach ($checks as $c) {
        if (!$c['ok']) {
            $allOk = false;
            break;
        }
    }

    return ['ok' => $allOk, 'checks' => $checks];
}

/**
 * @return array{count: int, zero_streak: int}
 */
function morozova_health_submissions_last_24h(PDO $pdo): array
{
    $stmt = $pdo->query(
        "SELECT COUNT(*) AS c FROM form_submissions
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
           AND name NOT LIKE 'Тест smoke%'"
    );
    $count = (int) ($stmt->fetchColumn() ?: 0);

    $zeroStreak = 0;
    $dayStmt = $pdo->prepare(
        "SELECT COUNT(*) FROM form_submissions
         WHERE DATE(created_at) = DATE(DATE_SUB(NOW(), INTERVAL :days DAY))
           AND name NOT LIKE 'Тест smoke%'"
    );
    for ($i = 0; $i < 3; $i++) {
        $dayStmt->execute([':days' => $i]);
        if ((int) ($dayStmt->fetchColumn() ?: 0) === 0) {
            $zeroStreak++;
        } else {
            break;
        }
    }

    return ['count' => $count, 'zero_streak' => $zeroStreak];
}
