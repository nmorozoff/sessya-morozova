# Pitfalls — сайт sessya-morozova

## Форма заявок (public/api)

**Инцидент 2025-10:** на проде `send-form.php` подключал `morozova-reels-lead.php`, файла не было → HTTP 500, заявки терялись ~12 дней без алерта.

### Обязательный пайплайн

1. Любое изменение `public/api/**` → `npm run preflight:api`
2. Коммит + push → по команде пользователя **«деплой»** → `npm run deploy:api`
3. `deploy:api` = preflight → sync-api-dist → FTP всего `public/api/` (кроме `config.php`, `max.config.php`) → HTTP-проверка файлов → `smoke-form`
4. Изменения фронта формы (`FormSection`, UTM) → `deploy:site` и **в конце** `npm run smoke:form`

### Правила кода

- Новый `require`/`include` — только вместе с целевым `.php` в **том же коммите**
- Вспомогательные модули подключать через `morozova_form_safe_require` / `file_exists`
- Не деплоить частичный список PHP вручную — только полный набор через `deploy:api`
- Секреты: `api/config.php`, `api/max.config.php` — только на сервере; локально `amocrm.secrets.env` для патча amo при деплое

### Откат

```bash
git log -3 --oneline
git checkout <commit> -- public/api/
npm run deploy:api   # только после слова «деплой»
```
