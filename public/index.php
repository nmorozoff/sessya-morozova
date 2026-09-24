<?php
declare(strict_types=1);

/**
 * Timeweb: nginx может отдавать / по index.html в обход Apache.
 * Если запрос дошёл до PHP — принудительно https://www и отдаём prerender index.html.
 */
// Timeweb: на http:// заголовок пустой; на https:// приходит X-Forwarded-Proto: https
$proto = strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''));
if ($proto !== 'https') {
    $uri = $_SERVER['REQUEST_URI'] ?? '/';
    header('Location: https://www.morozovanatalia.ru' . $uri, true, 301);
    exit;
}

$html = __DIR__ . '/home-shell.html';
if (!is_readable($html)) {
    http_response_code(500);
    exit('home-shell.html missing');
}

header('Content-Type: text/html; charset=utf-8');
readfile($html);
