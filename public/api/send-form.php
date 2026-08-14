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

/**
 * @param array<string, mixed> $context
 */
function morozova_form_log(string $level, string $message, array $context = []): void
{
    $logDir = __DIR__ . '/logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }

    $line = date('Y-m-d H:i:s') . " [{$level}] {$message}";
    if ($context !== []) {
        $encoded = json_encode($context, JSON_UNESCAPED_UNICODE);
        if ($encoded !== false) {
            $line .= ' ' . $encoded;
        }
    }

    @file_put_contents($logDir . '/form-errors.log', $line . "\n", FILE_APPEND | LOCK_EX);
}

function morozova_trim_field(string $value, int $maxLen): string
{
    $value = trim($value);
    if ($value === '') {
        return '';
    }
    if (mb_strlen($value) > $maxLen) {
        return mb_substr($value, 0, $maxLen);
    }
    return $value;
}

/**
 * @return array{label: string, account: string}
 */
function morozova_utm_source_meta(string $utmSource): array
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
    ];

    if (isset($map[$key])) {
        return $map[$key];
    }

    return ['label' => $utmSource, 'account' => ''];
}

function morozova_notify_source_label(string $utmSource): string
{
    $utmSource = trim($utmSource);
    if ($utmSource === '') {
        return 'прямой заход';
    }

    $meta = morozova_utm_source_meta($utmSource);
    return $meta['label'] . ' (' . $utmSource . ')';
}

/**
 * Маппинг utm_source → enum leadSource в Twenty CRM (crm-bridge).
 */
function morozova_crm_lead_source(string $utmSource): string
{
    $key = strtolower(trim($utmSource));

    if ($key === '' || $key === 'direct') {
        return 'Сайт';
    }

    if ($key === 'max') {
        return 'Канал Max';
    }

    if (str_starts_with($key, 'vk')) {
        return 'ВК';
    }

    if (str_starts_with($key, 'tg')) {
        return 'ТГ';
    }

    return 'Сайт';
}

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
$utmSource = morozova_trim_field((string)($data['utm_source'] ?? ''), 64);
$utmCampaign = morozova_trim_field((string)($data['utm_campaign'] ?? ''), 128);
$utmMedium = morozova_trim_field((string)($data['utm_medium'] ?? ''), 64);
$landingPath = morozova_trim_field((string)($data['landing_path'] ?? ''), 512);

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

$logContext = [
    'name' => $name,
    'contact' => $contact,
    'utm_source' => $utmSource !== '' ? $utmSource : null,
    'utm_campaign' => $utmCampaign !== '' ? $utmCampaign : null,
];

$dbOk = false;

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
        'INSERT INTO form_submissions (name, contact, message, utm_source, utm_campaign, utm_medium, landing_path)
         VALUES (:name, :contact, :message, :utm_source, :utm_campaign, :utm_medium, :landing_path)'
    );
    $stmt->execute([
        ':name' => $name,
        ':contact' => $contact,
        ':message' => $message !== '' ? $message : null,
        ':utm_source' => $utmSource !== '' ? $utmSource : null,
        ':utm_campaign' => $utmCampaign !== '' ? $utmCampaign : null,
        ':utm_medium' => $utmMedium !== '' ? $utmMedium : null,
        ':landing_path' => $landingPath !== '' ? $landingPath : null,
    ]);
    $dbOk = true;
} catch (Throwable $e) {
    morozova_form_log('error', 'database_insert_failed', [
        'error' => $e->getMessage(),
        'context' => $logContext,
    ]);
    error_log('DB error: ' . $e->getMessage());
}

$sourceLines = ['📍 Источник: ' . morozova_notify_source_label($utmSource)];
if ($utmCampaign !== '') {
    $sourceLines[] = '🎯 Кампания: ' . $utmCampaign;
}
if ($utmMedium !== '') {
    $sourceLines[] = '📣 Канал: ' . $utmMedium;
}
if ($landingPath !== '') {
    $sourceLines[] = '🔗 Страница: ' . $landingPath;
}

$telegramText = implode("\n", array_filter([
    '📩 Новая заявка с сайта',
    '',
    ...$sourceLines,
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
$curlError = curl_error($ch);
curl_close($ch);

$telegramOk = $httpCode >= 200 && $httpCode < 300;

if (!$telegramOk) {
    morozova_form_log('error', 'telegram_send_failed', [
        'http_code' => $httpCode,
        'curl_error' => $curlError,
        'response' => is_string($telegramResponse) ? mb_substr($telegramResponse, 0, 500) : null,
        'context' => $logContext,
    ]);
    error_log('Telegram error: ' . (string)$telegramResponse);
}

$crmOk = false;
$crmWebhookPath = __DIR__ . '/crm-webhook.php';
if (file_exists($crmWebhookPath)) {
    require_once $crmWebhookPath;

    $crmMessageParts = [];
    if ($utmCampaign !== '') {
        $crmMessageParts[] = 'utm_campaign: ' . $utmCampaign;
    }
    if ($utmMedium !== '') {
        $crmMessageParts[] = 'utm_medium: ' . $utmMedium;
    }
    if ($landingPath !== '') {
        $crmMessageParts[] = 'landing: ' . $landingPath;
    }
    if ($message !== '') {
        $crmMessageParts[] = $message;
    }

    if (!empty($config['crm_webhook_url']) && !empty($config['crm_webhook_secret'])) {
        $crmOk = morozova_crm_send_lead([
            'webhook_url' => $config['crm_webhook_url'],
            'webhook_secret' => $config['crm_webhook_secret'],
            'name' => $name,
            'contact' => $contact,
            'message' => implode("\n", $crmMessageParts),
            'source_site' => 'morozovanatalia.ru',
            'prefer_messaging' => false,
            'lead_source' => morozova_crm_lead_source($utmSource),
        ]);

        if (!$crmOk) {
            morozova_form_log('warn', 'crm_webhook_failed', ['context' => $logContext]);
        }
    }
}

if (!$dbOk && !$telegramOk) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Submission failed']);
    exit;
}

if (!$dbOk || !$telegramOk) {
    morozova_form_log('warn', 'partial_submission', [
        'db_ok' => $dbOk,
        'telegram_ok' => $telegramOk,
        'crm_ok' => $crmOk,
        'context' => $logContext,
    ]);
}

echo json_encode(['success' => true]);
