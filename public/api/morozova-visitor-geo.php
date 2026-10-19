<?php
declare(strict_types=1);

/**
 * Геолокация посетителя по IP при отправке формы (для CRM / Max).
 * Не совпадает на 100% с Метрикой (VPN, мобильный роуминг), но совпадает чаще, чем timezone в браузере.
 */

function morozova_geo_trim(string $value, int $max = 128): string
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

function morozova_client_ip(): string
{
    $candidates = [];

    $xff = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if (is_string($xff) && $xff !== '') {
        foreach (explode(',', $xff) as $part) {
            $part = trim($part);
            if ($part !== '') {
                $candidates[] = $part;
            }
        }
    }

    if (!empty($_SERVER['HTTP_X_REAL_IP'])) {
        $candidates[] = trim((string) $_SERVER['HTTP_X_REAL_IP']);
    }
    if (!empty($_SERVER['REMOTE_ADDR'])) {
        $candidates[] = trim((string) $_SERVER['REMOTE_ADDR']);
    }

    foreach ($candidates as $ip) {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return $ip;
        }
    }

    return '';
}

/**
 * @return array{country_code: string, country: string, city: string, region: string, label: string, ip: string}
 */
function morozova_country_label_ru(string $code, string $fallbackEn = ''): string
{
    $code = strtoupper(trim($code));
    $map = [
        'RU' => 'Россия',
        'AE' => 'ОАЭ',
        'KZ' => 'Казахстан',
        'BY' => 'Беларусь',
        'UA' => 'Украина',
        'US' => 'США',
        'GB' => 'Великобритания',
        'DE' => 'Германия',
        'IL' => 'Израиль',
        'TR' => 'Турция',
        'GE' => 'Грузия',
        'AM' => 'Армения',
        'UZ' => 'Узбекистан',
        'KG' => 'Киргизия',
        'TJ' => 'Таджикистан',
        'TH' => 'Таиланд',
        'CY' => 'Кипр',
        'ES' => 'Испания',
        'FR' => 'Франция',
        'IT' => 'Италия',
    ];

    if ($code !== '' && isset($map[$code])) {
        return $map[$code];
    }

    return morozova_geo_trim($fallbackEn, 64);
}

/**
 * Подпись для CRM / Max: для России — всегда с городом (или регионом, если города нет).
 *
 * @param array{country_code?: string, country?: string, city?: string, region?: string} $geo
 */
function morozova_format_visitor_geo_label(array $geo): string
{
    $code = strtoupper(morozova_geo_trim((string) ($geo['country_code'] ?? ''), 8));
    $country = morozova_geo_trim((string) ($geo['country'] ?? ''), 64);
    $city = morozova_geo_trim((string) ($geo['city'] ?? ''), 64);
    $region = morozova_geo_trim((string) ($geo['region'] ?? ''), 64);

    if ($code === 'RU' || $country === 'Россия') {
        if ($city !== '') {
            return morozova_geo_trim('Россия, ' . $city, 128);
        }
        if ($region !== '') {
            return morozova_geo_trim('Россия, ' . $region, 128);
        }

        return 'Россия';
    }

    $parts = array_values(array_filter([$country, $city !== '' ? $city : $region]));

    return morozova_geo_trim(implode(', ', $parts), 128);
}

/**
 * @return array{country_code: string, country: string, city: string, region: string, label: string, ip: string}
 */
function morozova_resolve_visitor_geo(?string $ip = null): array
{
    $empty = [
        'country_code' => '',
        'country' => '',
        'city' => '',
        'region' => '',
        'label' => '',
        'ip' => '',
    ];

    $ip = $ip ?? morozova_client_ip();
    if ($ip === '') {
        return $empty;
    }

    $empty['ip'] = $ip;

    $url = 'http://ip-api.com/json/' . rawurlencode($ip) . '?fields=status,country,countryCode,regionName,city&lang=ru';
    $ctx = stream_context_create([
        'http' => [
            'timeout' => 1.5,
            'ignore_errors' => true,
            'header' => "User-Agent: morozovanatalia-form/1.0\r\n",
        ],
    ]);

    $raw = @file_get_contents($url, false, $ctx);
    if ($raw === false || $raw === '') {
        return $empty;
    }

    $data = json_decode($raw, true);
    if (!is_array($data) || ($data['status'] ?? '') !== 'success') {
        return $empty;
    }

    $code = morozova_geo_trim((string) ($data['countryCode'] ?? ''), 8);
    $country = morozova_country_label_ru($code, (string) ($data['country'] ?? ''));
    $city = morozova_geo_trim((string) ($data['city'] ?? ''), 64);
    $region = morozova_geo_trim((string) ($data['regionName'] ?? ''), 64);

    $geo = [
        'country_code' => $code,
        'country' => $country,
        'city' => $city,
        'region' => $region,
        'ip' => $ip,
    ];
    $geo['label'] = morozova_format_visitor_geo_label($geo);

    return $geo;
}
