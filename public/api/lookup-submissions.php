<?php
/**
 * Поиск заявок в form_submissions (защищённый).
 * GET ?name=Дмитрий&days=3
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$config = require __DIR__ . '/config.php';
$secret = trim((string) ($config['internal_api_secret'] ?? ''));
$provided = trim((string) ($_SERVER['HTTP_X_MOROZOVA_INTERNAL_SECRET'] ?? $_GET['secret'] ?? ''));

if ($secret === '' || $provided !== $secret) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'forbidden']);
    exit;
}

$name = trim((string) ($_GET['name'] ?? ''));
$days = max(1, min(90, (int) ($_GET['days'] ?? 7)));

try {
    $pdo = new PDO(
        sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $config['db_host'] ?? 'localhost',
            $config['port'] ?? $config['db_port'] ?? '3306',
            $config['db_name'] ?? ''
        ),
        $config['db_user'] ?? '',
        $config['db_pass'] ?? '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $sql = 'SELECT id, name, contact, message, utm_source, utm_campaign, utm_medium, landing_path, referrer, visitor_geo, created_at
            FROM form_submissions
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)';
    $params = [':days' => $days];
    if ($name !== '') {
        $sql .= ' AND name LIKE :name';
        $params[':name'] = '%' . $name . '%';
    }
    $sql .= ' ORDER BY id DESC LIMIT 50';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['ok' => true, 'count' => count($rows), 'rows' => $rows], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
