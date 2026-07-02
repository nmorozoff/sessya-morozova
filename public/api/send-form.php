<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server not configured']);
    exit;
}

$config = require $configPath;

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit;
}

$name = trim((string)($data['name'] ?? ''));
$contact = trim((string)($data['contact'] ?? ''));
$message = trim((string)($data['message'] ?? ''));
$website = trim((string)($data['website'] ?? ''));

if ($website !== '') {
    echo json_encode(['success' => true]);
    exit;
}

if ($name === '' || $contact === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Name and contact are required']);
    exit;
}

if (mb_strlen($name) > 255 || mb_strlen($contact) > 255) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Field too long']);
    exit;
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

    $stmt = $pdo->prepare(
        'INSERT INTO form_submissions (name, contact, message) VALUES (:name, :contact, :message)'
    );
    $stmt->execute([
        ':name' => $name,
        ':contact' => $contact,
        ':message' => $message !== '' ? $message : null,
    ]);
} catch (Throwable $e) {
    error_log('DB error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
    exit;
}

$telegramText = implode("\n", array_filter([
    '📩 Новая заявка с сайта',
    '',
    "👤 Имя: {$name}",
    "📱 Контакт: {$contact}",
    $message !== '' ? "💬 Сообщение: {$message}" : '',
]));

$telegramUrl = sprintf(
    'https://api.telegram.org/bot%s/sendMessage',
    $config['telegram_bot_token']
);

$ch = curl_init($telegramUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode([
        'chat_id' => $config['telegram_chat_id'],
        'text' => $telegramText,
    ]),
    CURLOPT_TIMEOUT => 10,
]);

$telegramResponse = curl_exec($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode < 200 || $httpCode >= 300) {
    error_log('Telegram error: ' . $telegramResponse);
    // Заявка уже в БД — не показываем ошибку пользователю
}

echo json_encode(['success' => true]);
