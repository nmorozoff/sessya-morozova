<?php
declare(strict_types=1);

/**
 * Лендинги рилсов: разбор offer/topic/utm, название сделки, теги, текст для Max.
 */

/**
 * @param array<string, mixed> $data
 * @return array{
 *   is_reels: bool,
 *   offer: string,
 *   topic: string,
 *   offer_label: string,
 *   topic_label: string,
 *   page_path: string,
 *   utm_content: string,
 *   utm_term: string,
 *   session_format: string,
 *   platform_tag: string,
 *   user_message: string,
 *   tags: list<string>
 * }
 */
function morozova_reels_parse_submission(array $data, string $message): array
{
    $offer = morozova_reels_norm_id((string) ($data['offer'] ?? ''));
    $topic = morozova_reels_norm_id((string) ($data['topic'] ?? ''));
    $pagePath = trim((string) ($data['page'] ?? $data['landing_path'] ?? ''));
    $utmContent = trim((string) ($data['utm_content'] ?? ''));
    $utmTerm = trim((string) ($data['utm_term'] ?? ''));
    $sessionFormat = '';

    $userLines = [];
    foreach (preg_split('/\R/u', $message) ?: [] as $line) {
        $line = trim($line);
        if ($line === '') {
            continue;
        }
        if (preg_match('/^\[reels\]\s*offer=(proba|sessiya)/iu', $line, $m)) {
            if ($offer === '') {
                $offer = morozova_reels_norm_id($m[1]);
            }
            continue;
        }
        if (preg_match('/^topic=(razvod|poterya)/iu', $line, $m)) {
            if ($topic === '') {
                $topic = morozova_reels_norm_id($m[1]);
            }
            continue;
        }
        if (preg_match('/^format=(online|offline)/iu', $line, $m)) {
            $sessionFormat = $m[1] === 'offline' ? 'Очно' : 'Онлайн';
            continue;
        }
        if (preg_match('/^utm_content=(.+)$/iu', $line, $m)) {
            if ($utmContent === '') {
                $utmContent = trim($m[1]);
            }
            continue;
        }
        if (preg_match('/^utm_term=(.+)$/iu', $line, $m)) {
            if ($utmTerm === '') {
                $utmTerm = trim($m[1]);
            }
            continue;
        }
        if (str_starts_with($line, '[reels]')) {
            continue;
        }
        $userLines[] = $line;
    }

    if ($offer === '' && $topic === '' && $pagePath !== '') {
        if (preg_match('#/probnaya-(razvod|poterya)/?#iu', $pagePath, $m)) {
            $offer = 'proba';
            $topic = morozova_reels_norm_id($m[1]);
        } elseif (preg_match('#/sessiya-(razvod|poterya)/?#iu', $pagePath, $m)) {
            $offer = 'sessiya';
            $topic = morozova_reels_norm_id($m[1]);
        }
    }

    $isReels = $offer !== '' || $topic !== '' || str_contains($message, '[reels]');
    if (!$isReels) {
        return [
            'is_reels' => false,
            'offer' => '',
            'topic' => '',
            'offer_label' => '',
            'topic_label' => '',
            'page_path' => $pagePath,
            'utm_content' => $utmContent,
            'utm_term' => $utmTerm,
            'session_format' => $sessionFormat,
            'platform_tag' => '',
            'user_message' => trim($message),
            'tags' => [],
        ];
    }

    $utmSource = morozova_reels_norm_id((string) ($data['utm_source'] ?? ''));
    $platformTag = morozova_reels_platform_tag($utmSource);

    $tags = ['reels'];
    if ($offer !== '') {
        $tags[] = $offer;
    }
    if ($topic !== '') {
        $tags[] = $topic;
    }
    if ($platformTag !== '') {
        $tags[] = $platformTag;
    }

    return [
        'is_reels' => true,
        'offer' => $offer,
        'topic' => $topic,
        'offer_label' => morozova_reels_offer_label($offer),
        'topic_label' => morozova_reels_topic_label($topic),
        'page_path' => $pagePath,
        'utm_content' => $utmContent,
        'utm_term' => $utmTerm,
        'session_format' => $sessionFormat,
        'platform_tag' => $platformTag,
        'user_message' => trim(implode("\n", $userLines)),
        'tags' => $tags,
    ];
}

function morozova_reels_norm_id(string $value): string
{
    $value = strtolower(trim($value));
    if ($value === '') {
        return '';
    }

    return preg_replace('/[^a-z0-9_]/', '', $value) ?? '';
}

function morozova_reels_offer_label(string $offer): string
{
    return match ($offer) {
        'proba' => 'Проба',
        'sessiya' => 'Сессия',
        default => $offer !== '' ? $offer : '—',
    };
}

function morozova_reels_topic_label(string $topic): string
{
    return match ($topic) {
        'razvod' => 'Развод',
        'poterya' => 'Потеря',
        default => $topic !== '' ? $topic : '—',
    };
}

function morozova_reels_platform_tag(string $utmSource): string
{
    if ($utmSource === '') {
        return '';
    }
    if ($utmSource === 'instagram' || str_starts_with($utmSource, 'ig')) {
        return 'instagram';
    }
    if ($utmSource === 'tiktok' || str_starts_with($utmSource, 'tt')) {
        return 'tiktok';
    }

    return '';
}

function morozova_reels_lead_title(string $firstName, string $lastName, array $reels): string
{
    $name = trim($firstName . ' ' . $lastName);
    if ($name === '') {
        $name = 'Клиент';
    }

    return sprintf(
        '[Reels] %s · %s · %s',
        $reels['offer_label'] !== '' ? $reels['offer_label'] : '—',
        $reels['topic_label'] !== '' ? $reels['topic_label'] : '—',
        $name
    );
}

function morozova_reels_traffic_label(string $utmSource, string $utmMedium): string
{
    $utmSource = strtolower(trim($utmSource));
    if ($utmSource === 'instagram' || str_starts_with($utmSource, 'ig')) {
        return 'Instagram (рилс)';
    }
    if ($utmSource === 'tiktok' || str_starts_with($utmSource, 'tt')) {
        return 'TikTok (рилс)';
    }
    if ($utmSource !== '') {
        return $utmSource . ($utmMedium !== '' ? ' / ' . $utmMedium : '');
    }

    return 'Рилс-лендинг';
}

/**
 * @param array<string, mixed> $reels
 */
function morozova_build_reels_max_notify_text(
    array $reels,
    string $name,
    string $contact,
    string $preferredChannel,
    string $utmSource,
    string $utmMedium,
): string {
    $page = trim((string) ($reels['page_path'] ?? ''));
    $lines = [
        'Новая заявка [Reels]:',
        'страница: ' . ($page !== '' ? $page : '—'),
        'оффер: ' . ($reels['offer_label'] ?? '—'),
        'тема: ' . ($reels['topic_label'] ?? '—'),
        'источник: ' . morozova_reels_traffic_label($utmSource, $utmMedium),
        'рилс: ' . (trim((string) ($reels['utm_content'] ?? '')) !== '' ? $reels['utm_content'] : '—'),
        'кодовое слово: ' . (trim((string) ($reels['utm_term'] ?? '')) !== '' ? $reels['utm_term'] : '—'),
        'имя: ' . $name,
        'мессенджер: ' . ($preferredChannel !== '' ? $preferredChannel : '—'),
        'контакт: ' . $contact,
    ];

    return implode("\n", $lines);
}
