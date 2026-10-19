<?php
declare(strict_types=1);

/**
 * OAuth-токены amoCRM: каноническое хранилище api/data/amocrm-tokens.json (не в git).
 * deploy:api не подменяет access_token из amocrm.secrets.env, если файл на сервере есть.
 */

function morozova_amocrm_tokens_path(): string
{
    return __DIR__ . '/data/amocrm-tokens.json';
}

/**
 * @return array{access_token?: string, refresh_token?: string, expires_at?: int, updated_at?: string}|null
 */
function morozova_amocrm_tokens_read(): ?array
{
    $path = morozova_amocrm_tokens_path();
    if (!is_file($path)) {
        return null;
    }
    $data = json_decode((string) file_get_contents($path), true);
    return is_array($data) ? $data : null;
}

/**
 * @param array<string, mixed> $tokens
 */
function morozova_amocrm_tokens_write(array $tokens): bool
{
    if (!is_dir(__DIR__ . '/data')) {
        @mkdir(__DIR__ . '/data', 0755, true);
    }
    $tokens['updated_at'] = date('c');
    $json = json_encode($tokens, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if ($json === false) {
        return false;
    }
    return @file_put_contents(morozova_amocrm_tokens_path(), $json, LOCK_EX) !== false;
}

function morozova_amocrm_jwt_exp(string $jwt): ?int
{
    $parts = explode('.', $jwt);
    if (count($parts) < 2) {
        return null;
    }
    $payload = $parts[1];
    $payload .= str_repeat('=', (4 - strlen($payload) % 4) % 4);
    $decoded = base64_decode(strtr($payload, '-_', '+/'), true);
    if ($decoded === false) {
        return null;
    }
    $data = json_decode($decoded, true);
    if (!is_array($data) || !isset($data['exp'])) {
        return null;
    }
    return (int) $data['exp'];
}

/**
 * Перенос из config.php в tokens.json (один раз).
 *
 * @param array<string, mixed> $amoConfig
 */
function morozova_amocrm_tokens_migrate_from_config(array $amoConfig): void
{
    if (morozova_amocrm_tokens_read() !== null) {
        return;
    }
    $access = trim((string) ($amoConfig['access_token'] ?? ''));
    if ($access === '') {
        return;
    }
    $refresh = trim((string) ($amoConfig['refresh_token'] ?? ''));
    $exp = morozova_amocrm_jwt_exp($access);
    morozova_amocrm_tokens_write([
        'access_token' => $access,
        'refresh_token' => $refresh,
        'expires_at' => $exp,
    ]);
}

/**
 * @param array<string, mixed> $amoConfig
 * @return array<string, mixed>
 */
function morozova_amocrm_merge_token_config(array $amoConfig): array
{
    morozova_amocrm_tokens_migrate_from_config($amoConfig);
    $stored = morozova_amocrm_tokens_read();
    if ($stored !== null && trim((string) ($stored['access_token'] ?? '')) !== '') {
        $amoConfig['access_token'] = trim((string) $stored['access_token']);
        if (!empty($stored['refresh_token'])) {
            $amoConfig['refresh_token'] = trim((string) $stored['refresh_token']);
        }
        if (!empty($stored['expires_at'])) {
            $amoConfig['expires_at'] = (int) $stored['expires_at'];
        }
    }
    return $amoConfig;
}

/**
 * OAuth refresh возможен только при полном наборе credentials (долгосрочный JWT без refresh — норма).
 *
 * @param array<string, mixed> $amoConfig
 */
function morozova_amocrm_refresh_available(array $amoConfig): bool
{
    $refresh = trim((string) ($amoConfig['refresh_token'] ?? ''));
    $clientId = trim((string) ($amoConfig['client_id'] ?? ''));
    $clientSecret = trim((string) ($amoConfig['client_secret'] ?? ''));
    $subdomain = trim((string) ($amoConfig['subdomain'] ?? ''));

    return $refresh !== '' && $clientId !== '' && $clientSecret !== '' && $subdomain !== '';
}

/**
 * @param array<string, mixed> $amoConfig
 * @return array{ok: bool, refreshed: bool, reason: string, http_status?: int}
 */
function morozova_amocrm_refresh_access_token(array $amoConfig): array
{
    if (!morozova_amocrm_refresh_available($amoConfig)) {
        return [
            'ok' => false,
            'refreshed' => false,
            'reason' => 'refresh_not_configured',
        ];
    }

    $refresh = trim((string) ($amoConfig['refresh_token'] ?? ''));
    $clientId = trim((string) ($amoConfig['client_id'] ?? ''));
    $clientSecret = trim((string) ($amoConfig['client_secret'] ?? ''));
    $subdomain = trim((string) ($amoConfig['subdomain'] ?? ''));
    $redirectUri = trim((string) ($amoConfig['redirect_uri'] ?? ''));

    $body = [
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'grant_type' => 'refresh_token',
        'refresh_token' => $refresh,
    ];
    if ($redirectUri !== '') {
        $body['redirect_uri'] = $redirectUri;
    }

    $url = 'https://' . $subdomain . '.amocrm.ru/oauth2/access_token';
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 20,
    ]);
    $response = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError !== '') {
        return ['ok' => false, 'refreshed' => false, 'reason' => 'curl_error', 'http_status' => $status];
    }

    $data = is_string($response) ? json_decode($response, true) : null;
    if ($status < 200 || $status >= 300 || !is_array($data)) {
        $title = is_array($data) ? (string) ($data['title'] ?? $data['hint'] ?? '') : '';
        return [
            'ok' => false,
            'refreshed' => false,
            'reason' => $title !== '' ? $title : 'oauth_http_' . $status,
            'http_status' => $status,
        ];
    }

    $access = trim((string) ($data['access_token'] ?? ''));
    $newRefresh = trim((string) ($data['refresh_token'] ?? $refresh));
    if ($access === '') {
        return ['ok' => false, 'refreshed' => false, 'reason' => 'empty_access_token_in_response', 'http_status' => $status];
    }

    $expiresIn = (int) ($data['expires_in'] ?? 0);
    $expiresAt = $expiresIn > 0 ? time() + $expiresIn : morozova_amocrm_jwt_exp($access);

    morozova_amocrm_tokens_write([
        'access_token' => $access,
        'refresh_token' => $newRefresh,
        'expires_at' => $expiresAt,
    ]);

    return ['ok' => true, 'refreshed' => true, 'reason' => 'token_refreshed', 'http_status' => $status];
}

/**
 * Обновить токен, если до истечения меньше $secondsBefore (по умолчанию 1 час).
 *
 * @param array<string, mixed> $amoConfig
 * @return array{config: array<string, mixed>, refreshed: bool, refresh_attempted: bool, refresh_ok: bool, refresh_reason: string}
 */
function morozova_amocrm_ensure_access_token(array $amoConfig, int $secondsBefore = 3600): array
{
    $amoConfig = morozova_amocrm_merge_token_config($amoConfig);
    $access = trim((string) ($amoConfig['access_token'] ?? ''));
    $expiresAt = (int) ($amoConfig['expires_at'] ?? 0);
    if ($expiresAt === 0 && $access !== '') {
        $expiresAt = morozova_amocrm_jwt_exp($access) ?? 0;
    }

    $needsRefresh = $access === ''
        || ($expiresAt > 0 && $expiresAt <= time() + $secondsBefore);

    if (!$needsRefresh) {
        return [
            'config' => $amoConfig,
            'refreshed' => false,
            'refresh_attempted' => false,
            'refresh_ok' => true,
            'refresh_reason' => '',
        ];
    }

    if (!morozova_amocrm_refresh_available($amoConfig)) {
        $stillValid = $access !== '' && ($expiresAt === 0 || $expiresAt > time());
        return [
            'config' => $amoConfig,
            'refreshed' => false,
            'refresh_attempted' => false,
            'refresh_ok' => $stillValid,
            'refresh_reason' => $stillValid ? '' : 'access_expired_no_refresh',
        ];
    }

    $result = morozova_amocrm_refresh_access_token($amoConfig);
    if ($result['ok']) {
        $amoConfig = morozova_amocrm_merge_token_config($amoConfig);
        return [
            'config' => $amoConfig,
            'refreshed' => true,
            'refresh_attempted' => true,
            'refresh_ok' => true,
            'refresh_reason' => 'token_refreshed_auto',
        ];
    }

    if ($access !== '' && $expiresAt > time()) {
        return [
            'config' => $amoConfig,
            'refreshed' => false,
            'refresh_attempted' => true,
            'refresh_ok' => false,
            'refresh_reason' => (string) $result['reason'],
        ];
    }

    return [
        'config' => $amoConfig,
        'refreshed' => false,
        'refresh_attempted' => true,
        'refresh_ok' => false,
        'refresh_reason' => (string) $result['reason'],
    ];
}

/**
 * Проверка API + токен (для health / сторожа).
 *
 * @param array<string, mixed> $amoConfig
 * @return array{name: string, ok: bool, alarm: bool, detail: string, http_status?: int}
 */
function morozova_amocrm_health_check(array $amoConfig): array
{
    require_once __DIR__ . '/morozova-amocrm.php';

    if (empty($amoConfig['enabled'])) {
        return ['name' => 'amocrm', 'ok' => true, 'alarm' => false, 'detail' => 'disabled'];
    }

    $ensure = morozova_amocrm_ensure_access_token($amoConfig);
    $cfg = $ensure['config'];

    if ($ensure['refreshed'] && $ensure['refresh_ok']) {
        $resp = morozova_amocrm_api_request($cfg, 'GET', '/api/v4/account');
        if ($resp['ok']) {
            return [
                'name' => 'amocrm',
                'ok' => true,
                'alarm' => false,
                'detail' => 'token_refreshed_auto',
                'http_status' => (int) ($resp['status'] ?? 0),
            ];
        }
    }

    if ($ensure['refresh_attempted'] && !$ensure['refresh_ok'] && trim((string) ($cfg['access_token'] ?? '')) === '') {
        return [
            'name' => 'amocrm',
            'ok' => false,
            'alarm' => true,
            'detail' => 'token_refresh_failed:' . morozova_amocrm_sanitize_error($ensure['refresh_reason']),
        ];
    }

    $resp = morozova_amocrm_api_request($cfg, 'GET', '/api/v4/account');
    if ($resp['ok']) {
        $detail = 'token_ok';
        if ($ensure['refreshed'] && $ensure['refresh_ok']) {
            $detail = 'token_refreshed_auto';
        }
        return [
            'name' => 'amocrm',
            'ok' => true,
            'alarm' => false,
            'detail' => $detail,
            'http_status' => (int) ($resp['status'] ?? 200),
        ];
    }

    if ($ensure['refresh_attempted'] && !$ensure['refresh_ok']) {
        return [
            'name' => 'amocrm',
            'ok' => false,
            'alarm' => true,
            'detail' => 'token_refresh_failed:' . morozova_amocrm_sanitize_error($ensure['refresh_reason'])
                . '; api:' . morozova_amocrm_sanitize_error((string) ($resp['error'] ?? '')),
            'http_status' => (int) ($resp['status'] ?? 0),
        ];
    }

    if (!$ensure['refresh_ok'] && ($ensure['refresh_reason'] ?? '') === 'access_expired_no_refresh') {
        return [
            'name' => 'amocrm',
            'ok' => false,
            'alarm' => true,
            'detail' => 'token_expired_no_refresh',
            'http_status' => (int) ($resp['status'] ?? 0),
        ];
    }

    return [
        'name' => 'amocrm',
        'ok' => false,
        'alarm' => true,
        'detail' => 'api_error:' . morozova_amocrm_sanitize_error((string) ($resp['error'] ?? 'unknown'))
            . '; http_' . (int) ($resp['status'] ?? 0),
        'http_status' => (int) ($resp['status'] ?? 0),
    ];
}

function morozova_amocrm_sanitize_error(string $message): string
{
    $message = preg_replace('/Bearer\s+\S+/i', 'Bearer [redacted]', $message) ?? $message;
    $message = preg_replace('/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/', '[jwt]', $message) ?? $message;
    if (mb_strlen($message) > 200) {
        $message = mb_substr($message, 0, 200);
    }
    return trim($message);
}
