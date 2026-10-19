<?php
/**
 * Удаление smoke-заявок из БД (только внутренний smoke/cleanup).
 * POST JSON: { "id": 123 } + заголовок X-Morozova-Internal-Secret
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
$id = is_array($data) ? (int) ($data['id'] ?? 0) : 0;
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'id_required']);
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
        "DELETE FROM form_submissions
         WHERE id = :id
           AND name LIKE :name_prefix
           AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)"
    );
    $stmt->execute([
        ':id' => $id,
        ':name_prefix' => 'Тест smoke%',
    ]);
    echo json_encode(['ok' => true, 'deleted' => $stmt->rowCount() > 0], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'db_error'], JSON_UNESCAPED_UNICODE);
}
