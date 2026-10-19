<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'checks' => [['name' => 'config', 'ok' => false, 'detail' => 'missing']]], JSON_UNESCAPED_UNICODE);
    exit;
}

$config = require $configPath;
require_once __DIR__ . '/morozova-health.php';

$result = morozova_health_run($config);
http_response_code($result['ok'] ? 200 : 503);
echo json_encode([
    'ok' => $result['ok'],
    'checks' => $result['checks'],
    'ts' => date('c'),
], JSON_UNESCAPED_UNICODE);
