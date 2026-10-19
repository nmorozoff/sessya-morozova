<?php
declare(strict_types=1);

function morozova_traffic_trim(string $value, int $max): string
{
    $value = trim($value);
    if ($value === '') {
        return '';
    }
    if (mb_strlen($value) > $max) {
        return mb_substr($value, 0, $max);
    }

    return $value;
}

/**
 * @return array{utm_source: string, utm_medium: string}|null
 */
function morozova_traffic_infer_from_referrer(string $referrer): ?array
{
    $referrer = trim($referrer);
    if ($referrer === '') {
        return null;
    }

    $host = parse_url($referrer, PHP_URL_HOST);
    if (!is_string($host) || $host === '') {
        return null;
    }

    $host = strtolower($host);
    $host = preg_replace('/^www\./', '', $host) ?? $host;

    $rules = [
        ['chatgpt.com', 'chatgpt.com', 'referral'],
        ['openai.com', 'chatgpt.com', 'referral'],
        ['yandex.', 'yandex', 'organic'],
        ['ya.ru', 'yandex', 'organic'],
        ['google.', 'google', 'organic'],
        ['bing.com', 'bing', 'organic'],
        ['duckduckgo.com', 'duckduckgo', 'organic'],
        ['dzen.ru', 'dzen', 'referral'],
        ['vk.com', 'vk', 'referral'],
        ['vk.ru', 'vk', 'referral'],
        ['t.me', 'telegram', 'referral'],
        ['telegram.', 'telegram', 'referral'],
        ['instagram.com', 'instagram', 'referral'],
        ['tiktok.com', 'tiktok', 'referral'],
        ['b17.ru', 'b17', 'referral'],
        ['facebook.com', 'fb', 'referral'],
        ['fb.com', 'fb', 'referral'],
        ['ok.ru', 'ok', 'referral'],
        ['maps.yandex', 'ym1', 'referral'],
        ['2gis.ru', 'gis1', 'referral'],
    ];

    foreach ($rules as [$needle, $source, $medium]) {
        if ($host === $needle || str_contains($host, $needle)) {
            return ['utm_source' => $source, 'utm_medium' => $medium];
        }
    }

    return ['utm_source' => $host, 'utm_medium' => 'referral'];
}

function morozova_traffic_is_same_site_referrer(string $referrer, string $siteHost = ''): bool
{
    $referrerHost = parse_url($referrer, PHP_URL_HOST);
    if (!is_string($referrerHost) || $referrerHost === '') {
        return true;
    }

    $referrerHost = strtolower(preg_replace('/^www\./', '', $referrerHost) ?? $referrerHost);
    $hosts = array_filter([
        'morozovanatalia.ru',
        'morozova-natalya.ru',
        strtolower(preg_replace('/^www\./', '', $siteHost) ?? $siteHost),
    ]);

    foreach ($hosts as $host) {
        if ($host !== '' && ($referrerHost === $host || str_ends_with($referrerHost, '.' . $host))) {
            return true;
        }
    }

    return false;
}

/**
 * @param array<string, mixed> $input
 * @return array{
 *   utm_source: string,
 *   utm_medium: string,
 *   utm_campaign: string,
 *   landing_path: string,
 *   referrer: string,
 *   source_inferred: bool
 * }
 */
function morozova_traffic_resolve_attribution(array $input, string $siteHost = ''): array
{
    $utmSource = morozova_traffic_trim((string) ($input['utm_source'] ?? ''), 64);
    $utmMedium = morozova_traffic_trim((string) ($input['utm_medium'] ?? ''), 64);
    $utmCampaign = morozova_traffic_trim((string) ($input['utm_campaign'] ?? ''), 128);
    $landingPath = morozova_traffic_trim((string) ($input['landing_path'] ?? ''), 512);
    $referrer = morozova_traffic_trim((string) ($input['referrer'] ?? ''), 512);
    $inferred = false;

    if ($referrer !== '' && morozova_traffic_is_same_site_referrer($referrer, $siteHost)) {
        $referrer = '';
    }

    if ($utmSource === '' && $referrer !== '') {
        $fromRef = morozova_traffic_infer_from_referrer($referrer);
        if ($fromRef !== null) {
            $utmSource = $fromRef['utm_source'];
            if ($utmMedium === '') {
                $utmMedium = $fromRef['utm_medium'];
            }
            $inferred = true;
        }
    }

    return [
        'utm_source' => $utmSource,
        'utm_medium' => $utmMedium,
        'utm_campaign' => $utmCampaign,
        'landing_path' => $landingPath,
        'referrer' => $referrer,
        'source_inferred' => $inferred,
    ];
}
