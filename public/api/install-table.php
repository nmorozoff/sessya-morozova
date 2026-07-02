<?php
declare(strict_types=1);

/**
 * Одноразовый скрипт: откройте в браузере один раз, затем удалите файл.
 * https://morozovanatalia.ru/api/install-table.php
 */
header('Content-Type: text/plain; charset=utf-8');

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo "Сначала создайте config.php рядом с этим файлом.\n";
    exit;
}

$config = require $configPath;

$sql = <<<'SQL'
CREATE TABLE IF NOT EXISTS form_submissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(255) NOT NULL,
  message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL;

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
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $pdo->exec($sql);
    echo "OK: таблица form_submissions создана.\n";
    echo "Удалите install-table.php с сервера.\n";
} catch (Throwable $e) {
    http_response_code(500);
    echo "Ошибка: " . $e->getMessage() . "\n";
}
