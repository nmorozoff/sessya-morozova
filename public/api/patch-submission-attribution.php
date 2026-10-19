<?php
/**
 * Разовое исправление utm/referrer в form_submissions (internal secret).
 * GET ?secret=...&id=99&utm_source=chatgpt.com&utm_medium=referral&landing_path=/parents-relationship/
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

$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'id required']);
    exit;
}

$utmSource = trim((string) ($_GET['utm_source'] ?? ''));
$utmMedium = trim((string) ($_GET['utm_medium'] ?? ''));
$utmCampaign = trim((string) ($_GET['utm_campaign'] ?? ''));
$landingPath = trim((string) ($_GET['landing_path'] ?? ''));
$referrer = trim((string) ($_GET['referrer'] ?? ''));
$visitorGeo = trim((string) ($_GET['visitor_geo'] ?? ''));

try {
    $pdo = new PDO(
        sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $config['db_host'] ?? 'localhost',
            $config['db_port'] ?? $config['db_port'] ?? '3306',
            $config['db_name'] ?? ''
        ),
        $config['db_user'] ?? '',
        $config['db_pass'] ?? '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    try {
        $pdo->exec('ALTER TABLE form_submissions ADD COLUMN referrer VARCHAR(512) NULL AFTER landing_path');
    } catch (Throwable $e) {
        // column exists
    }
    try {
        $pdo->exec('ALTER TABLE form_submissions ADD COLUMN visitor_geo VARCHAR(128) NULL AFTER referrer');
    } catch (Throwable $e) {
        // column exists
    }

    $stmt = $pdo->prepare(
        'UPDATE form_submissions SET
            utm_source = COALESCE(NULLIF(:utm_source, \'\'), utm_source),
            utm_medium = COALESCE(NULLIF(:utm_medium, \'\'), utm_medium),
            utm_campaign = COALESCE(NULLIF(:utm_campaign, \'\'), utm_campaign),
            landing_path = COALESCE(NULLIF(:landing_path, \'\'), landing_path),
            referrer = COALESCE(NULLIF(:referrer, \'\'), referrer),
            visitor_geo = COALESCE(NULLIF(:visitor_geo, \'\'), visitor_geo)
         WHERE id = :id'
    );
    $stmt->execute([
        ':id' => $id,
        ':utm_source' => $utmSource,
        ':utm_medium' => $utmMedium,
        ':utm_campaign' => $utmCampaign,
        ':landing_path' => $landingPath,
        ':referrer' => $referrer,
        ':visitor_geo' => $visitorGeo,
    ]);

    echo json_encode(['ok' => true, 'updated' => $stmt->rowCount(), 'id' => $id], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
