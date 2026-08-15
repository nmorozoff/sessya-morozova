<?php
/**
 * Отправка уведомлений администратору через MAX Bot API.
 */
declare(strict_types=1);

/**
 * @param array{
 *   enabled?: bool,
 *   api_base_url?: string,
 *   bot_token?: string,
 *   recipient_user_id?: int|string|null,
 *   recipient_chat_id?: int|string|null,
 *   timeout_sec?: int
 * } $config
 */
function morozova_max_send_message(array $config, string $text): bool
{
    if (empty($config['enabled'])) {
        return false;
    }

    $token = trim((string) ($config['bot_token'] ?? ''));
    if ($token === '') {
        error_log('max_notify: bot_token is empty');
        return false;
    }

    $userId = trim((string) ($config['recipient_user_id'] ?? ''));
    $chatId = trim((string) ($config['recipient_chat_id'] ?? ''));

    if ($userId === '' && $chatId === '') {
        error_log('max_notify: recipient_user_id or recipient_chat_id is required');
        return false;
    }

    $baseUrl = rtrim((string) ($config['api_base_url'] ?? 'https://platform-api2.max.ru'), '/');
    $query = $userId !== '' ? 'user_id=' . rawurlencode($userId) : 'chat_id=' . rawurlencode($chatId);
    $query .= '&disable_link_preview=true';
    $url = $baseUrl . '/messages?' . $query;

    $body = json_encode(['text' => $text], JSON_UNESCAPED_UNICODE);
    if ($body === false) {
        error_log('max_notify: json_encode failed');
        return false;
    }

    $timeout = (int) ($config['timeout_sec'] ?? 12);
    if ($timeout < 3) {
        $timeout = 3;
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: ' . $token,
        ],
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_TIMEOUT => $timeout,
    ]);

    $response = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError !== '') {
        error_log('max_notify curl error: ' . $curlError);
        return false;
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        error_log('max_notify HTTP ' . $httpCode . ': ' . (string) $response);
        return false;
    }

    return true;
}

/**
 * @param array<string, mixed> $baseConfig
 * @return array<string, mixed>
 */
function morozova_max_load_config(array $baseConfig): array
{
    $inline = is_array($baseConfig['max'] ?? null) ? $baseConfig['max'] : [];

    $path = __DIR__ . '/max.config.php';
    if (file_exists($path)) {
        /** @var array<string, mixed> $fileConfig */
        $fileConfig = require $path;
        return array_merge($fileConfig, $inline);
    }

    return $inline;
}
