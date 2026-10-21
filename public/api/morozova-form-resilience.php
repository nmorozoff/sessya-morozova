<?php
declare(strict_types=1);

/**
 * Устойчивость формы: резервное хранение, оповещения ops, безопасные подключения.
 */

function morozova_form_data_dir(): string
{
    return __DIR__ . '/data';
}

function morozova_form_backup_path(): string
{
    return morozova_form_data_dir() . '/failed-leads.jsonl';
}

function morozova_form_ensure_data_dir(): bool
{
    $dir = morozova_form_data_dir();
    if (is_dir($dir)) {
        return true;
    }
    return @mkdir($dir, 0755, true);
}

/** Разрешённые поля резерва (без токенов, config, сырого POST). */
const MOROZOVA_FORM_BACKUP_ALLOWED_KEYS = [
    'source',
    'submission_id',
    'name',
    'contact',
    'message',
    'utm_source',
    'utm_campaign',
    'utm_medium',
    'landing_path',
    'referrer',
    'visitor_geo',
    'wants_trial_session',
    'db_ok',
];

/**
 * @param array<string, mixed> $record
 */
function morozova_form_append_backup(array $record): bool
{
    if (!morozova_form_ensure_data_dir()) {
        return false;
    }

    $safe = [];
    foreach (MOROZOVA_FORM_BACKUP_ALLOWED_KEYS as $key) {
        if (array_key_exists($key, $record)) {
            $safe[$key] = $record[$key];
        }
    }
    $safe['stored_at'] = date('c');
    $record = $safe;
    $line = json_encode($record, JSON_UNESCAPED_UNICODE);
    if ($line === false) {
        return false;
    }

    return @file_put_contents(morozova_form_backup_path(), $line . "\n", FILE_APPEND | LOCK_EX) !== false;
}

function morozova_form_safe_require(string $basename): bool
{
    $path = __DIR__ . '/' . ltrim($basename, '/');
    if (!file_exists($path)) {
        if (function_exists('morozova_form_log')) {
            morozova_form_log('error', 'missing_module', ['file' => $basename]);
        }
        return false;
    }
    require_once $path;
    return true;
}

function morozova_form_register_shutdown_handler(): void
{
    static $registered = false;
    if ($registered) {
        return;
    }
    $registered = true;

    register_shutdown_function(static function (): void {
        $err = error_get_last();
        if ($err === null) {
            return;
        }
        $fatalTypes = [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR];
        if (!in_array($err['type'], $fatalTypes, true)) {
            return;
        }
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode([
            'success' => false,
            'error' => 'Внутренняя ошибка при обработке заявки. Попробуйте ещё раз или напишите в мессенджер.',
            'fatal' => true,
        ], JSON_UNESCAPED_UNICODE);
    });
}

/**
 * @param array<string, mixed> $config
 */
function morozova_form_submission_is_test_sql(): string
{
    return "(name LIKE 'Тест%' OR LOWER(name) LIKE '%smoke%' OR message LIKE '[smoke:%')";
}

function morozova_form_max_ops_alert(array $config, string $text): bool
{
    if (!morozova_form_safe_require('max-notify.php')) {
        return false;
    }
    $maxConfig = morozova_max_load_config($config);
    $prefix = '⚠️ Сбой формы: ';
    return morozova_max_send_message($maxConfig, $prefix . $text);
}

/**
 * Ежедневный отчёт сторожа (21:00 МСК) — без префикса «сбой».
 *
 * @param array<string, mixed> $config
 */
function morozova_form_max_ops_daily_report(array $config, string $text): bool
{
    if (!morozova_form_safe_require('max-notify.php')) {
        return false;
    }
    $maxConfig = morozova_max_load_config($config);
    return morozova_max_send_message($maxConfig, $text);
}

/**
 * Текст ежедневного отчёта по статистике morozova_health_submissions_last_24h().
 *
 * @param array{count: int, test_count: int, zero_streak: int} $stats
 */
function morozova_form_daily_report_message(array $stats): string
{
    $n = (int) ($stats['count'] ?? 0);
    $m = (int) ($stats['test_count'] ?? 0);
    $text = "✅ Форма работает.\nЗаявок за сутки: {$n}";
    if ($m > 0) {
        $text .= "\nтестовых: {$m}";
    }
    if ((int) ($stats['zero_streak'] ?? 0) >= 3) {
        $text .= "\n(три дня подряд без заявок — проверьте форму и рекламу)";
    }

    return $text;
}

/**
 * @param list<string> $parts
 * @param array<string, mixed> $config
 */
function morozova_form_notify_partial_failures(array $parts, array $config): void
{
    if ($parts === []) {
        return;
    }
    $where = [];
    $dbSaved = false;
    $fileSaved = false;
    foreach ($parts as $part) {
        if (str_contains($part, 'база')) {
            $dbSaved = true;
        }
        if (str_contains($part, 'файл')) {
            $fileSaved = true;
        }
    }
    $savedHint = 'заявка сохранена';
    if ($dbSaved && $fileSaved) {
        $savedHint = 'заявка сохранена в базе и файле';
    } elseif ($dbSaved) {
        $savedHint = 'заявка сохранена в базе';
    } elseif ($fileSaved) {
        $savedHint = 'заявка сохранена в файле';
    } else {
        $savedHint = 'заявка могла не сохраниться — проверьте логи';
    }
    morozova_form_max_ops_alert($config, implode('; ', $parts) . ', ' . $savedHint);
}

function morozova_form_send_json(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * @param array<string, mixed> $data
 * @return array{utm_source: string, utm_campaign: string, utm_medium: string, landing_path: string, referrer: string, source_inferred: bool}
 */
function morozova_form_attribution_fallback(array $data): array
{
    return [
        'utm_source' => trim((string) ($data['utm_source'] ?? '')),
        'utm_campaign' => trim((string) ($data['utm_campaign'] ?? '')),
        'utm_medium' => trim((string) ($data['utm_medium'] ?? '')),
        'landing_path' => trim((string) ($data['landing_path'] ?? '')),
        'referrer' => trim((string) ($data['referrer'] ?? '')),
        'source_inferred' => false,
    ];
}

/**
 * @return array{label: string, country: string, city: string}
 */
function morozova_form_visitor_geo_fallback(): array
{
    return ['label' => '', 'country' => '', 'city' => ''];
}
