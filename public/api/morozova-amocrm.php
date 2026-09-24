<?php
/**
 * Отправка лида в amoCRM (REST API v4, без VPS / crm-bridge).
 */
declare(strict_types=1);

/**
 * @param array{
 *   enabled?: bool,
 *   subdomain?: string,
 *   access_token?: string,
 *   pipeline_id?: int|string|null,
 *   status_id?: int|string|null,
 *   format_field_id?: int|string|null,
 *   request_field_id?: int|string|null,
 *   messenger_field_id?: int|string|null,
 *   telegram_field_id?: int|string|null,
 *   traffic_source_field_id?: int|string|null,
 *   utm_code_field_id?: int|string|null,
 *   utm_campaign_field_id?: int|string|null,
 *   utm_medium_field_id?: int|string|null,
 *   traffic_account_field_id?: int|string|null
 * } $config
 * @return array{ok: bool, status: int, data: mixed, error: string}
 */
function morozova_amocrm_api_request(array $config, string $method, string $path, ?array $body = null): array
{
    $subdomain = trim((string) ($config['subdomain'] ?? ''));
    $token = trim((string) ($config['access_token'] ?? ''));

    if ($subdomain === '' || $token === '') {
        return ['ok' => false, 'status' => 0, 'data' => null, 'error' => 'amocrm subdomain or access_token missing'];
    }

    $url = 'https://' . $subdomain . '.amocrm.ru' . $path;
    $headers = [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
    ];

    $ch = curl_init($url);
    $options = [
        CURLOPT_CUSTOMREQUEST => strtoupper($method),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 15,
    ];

    if ($body !== null) {
        $encoded = json_encode($body, JSON_UNESCAPED_UNICODE);
        if ($encoded === false) {
            return ['ok' => false, 'status' => 0, 'data' => null, 'error' => 'json_encode failed'];
        }
        $options[CURLOPT_POSTFIELDS] = $encoded;
    }

    curl_setopt_array($ch, $options);
    $response = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError !== '') {
        return ['ok' => false, 'status' => $status, 'data' => null, 'error' => $curlError];
    }

    $data = null;
    if (is_string($response) && $response !== '') {
        $data = json_decode($response, true);
    }

    $ok = $status >= 200 && $status < 300;
    $error = '';
    if (!$ok) {
        if (is_array($data) && isset($data['title'])) {
            $error = (string) $data['title'];
            if (!empty($data['detail'])) {
                $error .= ': ' . (string) $data['detail'];
            }
        } else {
            $error = is_string($response) ? mb_substr($response, 0, 500) : 'HTTP ' . $status;
        }
    }

    return ['ok' => $ok, 'status' => $status, 'data' => $data, 'error' => $error];
}

/**
 * @param array<string, mixed> $payload
 * @param array<string, mixed> $config
 */
function morozova_amocrm_set_custom_field(array &$payload, array $config, string $configKey, string $value): void
{
    $value = trim($value);
    if ($value === '') {
        return;
    }

    $fieldId = (int) ($config[$configKey] ?? 0);
    if ($fieldId <= 0) {
        return;
    }

    if (!isset($payload['custom_fields_values']) || !is_array($payload['custom_fields_values'])) {
        $payload['custom_fields_values'] = [];
    }

    $payload['custom_fields_values'][] = [
        'field_id' => $fieldId,
        'values' => [
            ['value' => $value],
        ],
    ];
}

/**
 * @param array<string, mixed> $payload
 */
function morozova_amocrm_set_field_code(array &$payload, string $fieldCode, string $value): void
{
    $value = trim($value);
    if ($value === '' || $fieldCode === '') {
        return;
    }

    if (!isset($payload['custom_fields_values']) || !is_array($payload['custom_fields_values'])) {
        $payload['custom_fields_values'] = [];
    }

    $payload['custom_fields_values'][] = [
        'field_code' => $fieldCode,
        'values' => [
            ['value' => $value],
        ],
    ];
}

/**
 * @return array{label: string, account: string}
 */
function morozova_amocrm_utm_meta(string $utmSource): array
{
    $key = strtolower(trim($utmSource));

    $map = [
        'ig1' => ['label' => 'Instagram 1', 'account' => '@nataliamorozova.psy'],
        'insta1' => ['label' => 'Instagram 1', 'account' => '@nataliamorozova.psy'],
        'ig2' => ['label' => 'Instagram 2', 'account' => '@natalia_morozova_psy'],
        'insta2' => ['label' => 'Instagram 2', 'account' => '@natalia_morozova_psy'],
        'ig3' => ['label' => 'Instagram 3', 'account' => '@morozova_natalia_psy'],
        'insta3' => ['label' => 'Instagram 3', 'account' => '@morozova_natalia_psy'],
        'insta' => ['label' => 'Instagram', 'account' => ''],
        'tt1' => ['label' => 'TikTok 1', 'account' => 'pair1'],
        'tiktok1' => ['label' => 'TikTok 1', 'account' => 'pair1'],
        'tt2' => ['label' => 'TikTok 2', 'account' => '@natalyamorozovapsy'],
        'tiktok2' => ['label' => 'TikTok 2', 'account' => '@natalyamorozovapsy'],
        'tt3' => ['label' => 'TikTok 3', 'account' => '@psy_morozova_'],
        'tiktok3' => ['label' => 'TikTok 3', 'account' => '@psy_morozova_'],
        'tiktok' => ['label' => 'TikTok', 'account' => ''],
        'vk' => ['label' => 'VK профиль', 'account' => 'vk.com/natalyamorozovapsy'],
        'vk1' => ['label' => 'VK профиль', 'account' => 'vk.com/natalyamorozovapsy'],
        'vk_group' => ['label' => 'VK группа', 'account' => 'vk.com/nataliamorozovapsy'],
        'vk2' => ['label' => 'VK группа', 'account' => 'vk.com/nataliamorozovapsy'],
        'tg1' => ['label' => 'Telegram', 'account' => '@nmorozova_emdr'],
        'tg2' => ['label' => 'Telegram', 'account' => '@natalia_morozova_psy'],
        'tg3' => ['label' => 'Telegram', 'account' => '@morozova_emdr'],
        'max' => ['label' => 'MAX', 'account' => 'max.ru/se13417616_biz'],
        'dzen' => ['label' => 'Дзен', 'account' => 'dzen.ru/morozova_emdr'],
        'b17' => ['label' => 'B17', 'account' => 'b17.ru/morozova_natalia'],
        'fb' => ['label' => 'Facebook', 'account' => ''],
        'chatgpt.com' => ['label' => 'ChatGPT', 'account' => ''],
        'chatgpt' => ['label' => 'ChatGPT', 'account' => ''],
    ];

    if (isset($map[$key])) {
        return $map[$key];
    }

    if (str_contains($key, 'chatgpt')) {
        return ['label' => 'ChatGPT', 'account' => ''];
    }

    if ($key === '' || $key === 'direct' || $key === 'site') {
        return ['label' => 'Прямой заход / сайт', 'account' => ''];
    }

    return ['label' => $utmSource, 'account' => ''];
}

function morozova_amocrm_source_label(string $utmSource): string
{
    $utmSource = trim($utmSource);
    if ($utmSource === '') {
        return 'Прямой заход';
    }

    $meta = morozova_amocrm_utm_meta($utmSource);
    return $meta['label'] . ' (' . $utmSource . ')';
}

/**
 * @param array<string, mixed> $config
 * @param array{
 *   name: string,
 *   contact: string,
 *   message?: string,
 *   metadata?: list<string>,
 *   source_site?: string,
 *   lead_source?: string,
 *   utm_source?: string|null,
 *   utm_medium?: string|null,
 *   utm_campaign?: string|null,
 *   traffic_source_label?: string|null,
 *   traffic_account?: string|null,
 *   preferred_channel?: string|null,
 *   session_format?: string|null
 * } $input
 */
function morozova_amocrm_send_lead(array $config, array $input): bool
{
    if (empty($config['enabled'])) {
        return false;
    }

    if (!function_exists('morozova_crm_split_name') || !function_exists('morozova_crm_parse_contact')) {
        foreach (['morozova-crm-webhook.php', 'crm-webhook.php'] as $helperFile) {
            $helpers = __DIR__ . '/' . $helperFile;
            if (file_exists($helpers)) {
                require_once $helpers;
                break;
            }
        }
    }

    $nameParts = morozova_crm_split_name((string) ($input['name'] ?? ''));
    $contactParts = morozova_crm_parse_contact((string) ($input['contact'] ?? ''));

    $sourceSite = trim((string) ($input['source_site'] ?? ''));
    $leadSource = trim((string) ($input['lead_source'] ?? 'Сайт'));
    $preferredChannel = trim((string) ($input['preferred_channel'] ?? ''));

    $noteLines = [];
    if ($sourceSite !== '') {
        $noteLines[] = '[' . $sourceSite . ']';
    }

    $utmSource = trim((string) ($input['utm_source'] ?? ''));
    $utmMedium = trim((string) ($input['utm_medium'] ?? ''));
    $utmCampaign = trim((string) ($input['utm_campaign'] ?? ''));
    $utmMeta = morozova_amocrm_utm_meta($utmSource);
    $trafficLabel = trim((string) ($input['traffic_source_label'] ?? ''));
    if ($trafficLabel === '') {
        $trafficLabel = morozova_amocrm_source_label($utmSource);
    }
    $trafficAccount = trim((string) ($input['traffic_account'] ?? ''));
    if ($trafficAccount === '' && $utmMeta['account'] !== '') {
        $trafficAccount = $utmMeta['account'];
    }

    $metadata = $input['metadata'] ?? [];
    if (is_array($metadata)) {
        foreach ($metadata as $line) {
            $line = trim((string) $line);
            if ($line !== '') {
                $noteLines[] = $line;
            }
        }
    }

    $userMessage = trim((string) ($input['message'] ?? ''));

    $leadName = 'Заявка: ' . trim($nameParts['firstName'] . ' ' . $nameParts['lastName']);

    $contactPayload = [
        'first_name' => $nameParts['firstName'],
    ];
    if ($nameParts['lastName'] !== '') {
        $contactPayload['last_name'] = $nameParts['lastName'];
    }

    if ($contactParts['phone'] !== '') {
        $contactPayload['custom_fields_values'][] = [
            'field_code' => 'PHONE',
            'values' => [
                [
                    'value' => $contactParts['phone'],
                    'enum_code' => 'WORK',
                ],
            ],
        ];
    }

    $leadPayload = [
        'name' => $leadName,
        '_embedded' => [
            'contacts' => [$contactPayload],
            'tags' => [
                ['name' => $leadSource],
            ],
        ],
    ];

    $pipelineId = (int) ($config['pipeline_id'] ?? 0);
    $statusId = (int) ($config['status_id'] ?? 0);
    if ($pipelineId > 0) {
        $leadPayload['pipeline_id'] = $pipelineId;
    }
    if ($statusId > 0) {
        $leadPayload['status_id'] = $statusId;
    }

    morozova_amocrm_set_custom_field($leadPayload, $config, 'request_field_id', $userMessage);
    $messengerFieldId = (int) ($config['messenger_field_id'] ?? 0);
    if ($preferredChannel !== '') {
        if ($messengerFieldId > 0) {
            morozova_amocrm_set_custom_field($leadPayload, $config, 'messenger_field_id', $preferredChannel);
        } else {
            $noteLines[] = 'Мессенджер: ' . $preferredChannel;
        }
    }
    morozova_amocrm_set_custom_field($leadPayload, $config, 'telegram_field_id', $contactParts['telegramNickname']);
    morozova_amocrm_set_custom_field($leadPayload, $config, 'traffic_source_field_id', $trafficLabel);
    morozova_amocrm_set_custom_field($leadPayload, $config, 'utm_code_field_id', $utmSource);
    morozova_amocrm_set_custom_field($leadPayload, $config, 'utm_campaign_field_id', $utmCampaign);
    morozova_amocrm_set_custom_field($leadPayload, $config, 'utm_medium_field_id', $utmMedium);
    morozova_amocrm_set_custom_field($leadPayload, $config, 'traffic_account_field_id', $trafficAccount);
    morozova_amocrm_set_field_code($leadPayload, 'UTM_SOURCE', $utmSource);
    morozova_amocrm_set_field_code($leadPayload, 'UTM_MEDIUM', $utmMedium);
    morozova_amocrm_set_field_code($leadPayload, 'UTM_CAMPAIGN', $utmCampaign);

    $sessionFormat = trim((string) ($input['session_format'] ?? ''));
    $formatFieldId = (int) ($config['format_field_id'] ?? 0);
    if ($formatFieldId > 0 && $sessionFormat !== '' && in_array($sessionFormat, ['Онлайн', 'Очно'], true)) {
        $leadPayload['custom_fields_values'][] = [
            'field_id' => $formatFieldId,
            'values' => [
                ['value' => $sessionFormat],
            ],
        ];
        $priceByFormat = ['Онлайн' => 5000, 'Очно' => 6500];
        $leadPayload['price'] = $priceByFormat[$sessionFormat];
    }

    $create = morozova_amocrm_api_request($config, 'POST', '/api/v4/leads/complex', [$leadPayload]);
    if (!$create['ok']) {
        error_log('morozova_amocrm complex failed: ' . $create['error']);
        return false;
    }

    $leadId = null;
    if (is_array($create['data'])) {
        $embedded = $create['data']['_embedded'] ?? null;
        if (is_array($embedded) && !empty($embedded['leads'][0]['id'])) {
            $leadId = (int) $embedded['leads'][0]['id'];
        }
    }

    if ($leadId === null || $noteLines === []) {
        return true;
    }

    $noteText = implode("\n", $noteLines);
    $note = morozova_amocrm_api_request(
        $config,
        'POST',
        '/api/v4/leads/notes',
        [
            [
                'entity_id' => $leadId,
                'note_type' => 'common',
                'params' => [
                    'text' => $noteText,
                ],
            ],
        ]
    );

    if (!$note['ok']) {
        error_log('morozova_amocrm note failed (lead created): ' . $note['error']);
        return true;
    }

    return true;
}
