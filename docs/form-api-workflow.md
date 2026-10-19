# Workflow: API формы заявок

## Деплой API

```bash
npm run preflight:api    # php -l + require/include
npm run deploy:api       # только после «деплой» от владельца репозитория
```

`deploy:api` заливает **все** файлы `public/api/*.php`, кроме:

| Файл | Поведение |
|------|-----------|
| `config.php` | Скачивается с сервера, мержится с `amocrm.secrets.env` (amo + internal secret), заливается обратно. **Пароль БД и Telegram с сервера сохраняются.** |
| `max.config.php` | Не в git, не в деплое — только на сервере |

Также заливаются `api/data/.htaccess`, `api/logs/.htaccess`, `api/.htaccess`.

## Проверки после деплоя

- HTTP: каждый PHP из манифеста не отдаёт 404
- `scripts/smoke-form.mjs` — тестовая заявка, amo, MAX, очистка БД/amo

## Мониторинг

- `GET /api/health.php` — публичный статус
- Cron Timeweb → `form-watch-cron.php` — см. `docs/timeweb-form-cron.md`

## Резерв заявок

`api/data/failed-leads.jsonl` — append каждой принятой заявки; каталог закрыт `.htaccess`.
