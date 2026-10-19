<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(503);
    echo json_encode([
        'ok' => false,
        'checks' => [['name' => 'config', 'ok' => false]],
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$config = require $configPath;
require_once __DIR__ . '/morozova-health.php';

$secret = (string) ($config['internal_api_secret'] ?? '');
$provided = (string) ($_SERVER['HTTP_X_MOROZOVA_INTERNAL_SECRET'] ?? '');
$verbose = $secret !== '' && hash_equals($secret, $provided);

$result = morozova_health_run($config);
http_response_code($result['ok'] ? 200 : 503);

$checks = [];
foreach ($result['checks'] as $check) {
    if ($verbose) {
        $checks[] = $check;
        continue;
    }
    $checks[] = [
        'name' => $check['name'],
        'ok' => $check['ok'],
    ];
}

echo json_encode([
    'ok' => $result['ok'],
    'checks' => $checks,
], JSON_UNESCAPED_UNICODE);
