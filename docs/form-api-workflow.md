# Workflow: API формы заявок

## Деплой API

```bash
npm run preflight:api    # php -l + require/include
npm run deploy:api       # только после «деплой» от владельца репозитория
```

`deploy:api` заливает **все** файлы `public/api/*.php`, кроме:

| Файл | Поведение |
|------|-----------|
| `config.php` | Скачивается с сервера, мержится с `amocrm.secrets.env` (поля amo, **не** access_token), internal secret. **Пароль БД и Telegram с сервера сохраняются.** |
| `api/data/amocrm-tokens.json` | **Канонический** `access_token` / `refresh_token` / `expires_at`. Создаётся на сервере при первом запросе (миграция из config) и при OAuth refresh. **Не в git, не перетирается deploy.** |
| `max.config.php` | Не в git, не в деплое — только на сервере |

### amoCRM OAuth

- В `amocrm.secrets.env` (локально, не в git): `AMO_INTEGRATION_ID`, `AMO_CLIENT_SECRET`; **`AMO_REFRESH_TOKEN` не обязателен** (долгосрочный JWT до ~2031).
- `AMO_ACCESS_TOKEN` в secrets — только для первичной настройки; **deploy больше не подставляет его в config**, берёт `access_token` с сервера.
- Обновление через refresh **только если** на сервере есть `refresh_token` + client credentials: за 1 час до `expires_at` или при HTTP 401.
- Health: `token_refreshed_auto` — не тревога; `token_refresh_failed` / `api_error` — тревога в MAX.

Также заливаются `api/data/.htaccess`, `api/logs/.htaccess`, `api/.htaccess`.

## Проверки после деплоя

- HTTP: каждый PHP из манифеста не отдаёт 404
- `scripts/smoke-form.mjs` — тестовая заявка, amo, MAX, очистка БД/amo

## Мониторинг

- `GET /api/health.php` — публичный статус
- Cron Timeweb → `form-watch-cron.php` — см. `docs/timeweb-form-cron.md`

## Резерв заявок

`api/data/failed-leads.jsonl` — append каждой принятой заявки; каталог закрыт `.htaccess`.
