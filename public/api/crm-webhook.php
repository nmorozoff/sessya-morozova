<?php
/**
 * Отправка лида в crm-bridge (Twenty CRM).
 * Используется на сервере — секрет не попадает в браузер.
 */
declare(strict_types=1);

/**
 * @return array{firstName: string, lastName: string}
 */
function morozova_crm_split_name(string $name): array
{
    $name = trim($name);
    if ($name === '') {
        return ['firstName' => 'Без имени', 'lastName' => ''];
    }

    $parts = preg_split('/\s+/u', $name, 2) ?: [];
    return [
        'firstName' => $parts[0] ?? $name,
        'lastName' => $parts[1] ?? '',
    ];
}

/**
 * @return array{phone: string, telegramNickname: string}
 */
function morozova_crm_parse_contact(string $contact): array
{
    $contact = trim($contact);
    if ($contact === '') {
        return ['phone' => '', 'telegramNickname' => ''];
    }

    if (preg_match('/t\.me\/([A-Za-z0-9_]+)/i', $contact, $m)) {
        return ['phone' => '', 'telegramNickname' => '@' . $m[1]];
    }

    $digits = preg_replace('/\D/', '', $contact);
    $looksLikePhone = strlen($digits) >= 10;
    $looksLikeTelegram = (bool) preg_match('/^@?[A-Za-z][A-Za-z0-9_]{3,}$/u', $contact);

    if ($looksLikeTelegram && !$looksLikePhone) {
        return ['phone' => '', 'telegramNickname' => $contact];
    }

    if ($looksLikePhone) {
        return ['phone' => $contact, 'telegramNickname' => ''];
    }

    if (preg_match('/[A-Za-z@]/', $contact)) {
        return ['phone' => '', 'telegramNickname' => $contact];
    }

    return ['phone' => $contact, 'telegramNickname' => ''];
}

/**
 * @param array{
 *   webhook_url: string,
 *   webhook_secret: string,
 *   name: string,
 *   contact: string,
 *   message?: string,
 *   source_site: string,
 *   prefer_messaging?: bool,
 *   lead_source?: string,
 *   utm_source?: string,
 *   preferred_channel?: string,
 *   whatsapp_nickname?: string
 * } $input
 */
function morozova_crm_send_lead(array $input): bool
{
    $url = trim($input['webhook_url'] ?? '');
    $secret = trim($input['webhook_secret'] ?? '');

    if ($url === '' || $secret === '') {
        error_log('morozova_crm: webhook_url or webhook_secret not configured');
        return false;
    }

    $nameParts = morozova_crm_split_name((string) ($input['name'] ?? ''));
    $contactParts = morozova_crm_parse_contact((string) ($input['contact'] ?? ''));

    $messageLines = [];
    $sourceSite = trim((string) ($input['source_site'] ?? ''));
    if ($sourceSite !== '') {
        $messageLines[] = '[' . $sourceSite . ']';
    }
    if (!empty($input['prefer_messaging'])) {
        $messageLines[] = 'Предпочитает переписку, а не звонок';
    }
    $userMessage = trim((string) ($input['message'] ?? ''));
    if ($userMessage !== '') {
        $messageLines[] = $userMessage;
    }

    $payload = [
        'firstName' => $nameParts['firstName'],
        'lastName' => $nameParts['lastName'],
        'leadSource' => $input['lead_source'] ?? 'Сайт',
        'message' => $messageLines !== [] ? implode("\n", $messageLines) : null,
        'consent' => true,
    ];

    if ($contactParts['phone'] !== '') {
        $payload['phone'] = $contactParts['phone'];
    }
    if ($contactParts['telegramNickname'] !== '') {
        $payload['telegramNickname'] = $contactParts['telegramNickname'];
    }
    if (!empty($input['preferred_channel'])) {
        $payload['preferredChannel'] = $input['preferred_channel'];
    }
    if (!empty($input['utm_source'])) {
        $payload['utmSource'] = trim((string) $input['utm_source']);
    }
    if (!empty($input['whatsapp_nickname'])) {
        $payload['whatsappNickname'] = trim((string) $input['whatsapp_nickname']);
    }

    $body = json_encode($payload, JSON_UNESCAPED_UNICODE);
    if ($body === false) {
        error_log('morozova_crm: json_encode failed');
        return false;
    }

    $signature = hash_hmac('sha256', $body, $secret);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-Webhook-Signature: sha256=' . $signature,
        ],
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_TIMEOUT => 12,
    ]);

    $response = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError !== '') {
        error_log('morozova_crm curl error: ' . $curlError);
        return false;
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        error_log('morozova_crm HTTP ' . $httpCode . ': ' . (string) $response);
        return false;
    }

    return true;
}
