# Сайт Натальи Морозовой — психолог

Лендинг на React + Vite. Фронтенд деплоится на Timeweb, форма заявок сохраняется в MySQL и дублируется в Telegram через PHP-скрипт.

## Стек

- React 18, TypeScript, Vite, Tailwind CSS
- PHP + MySQL на Timeweb (форма заявок)
- GitHub Actions → FTP деплой на Timeweb

## Локальная разработка

```sh
npm install
cp .env.example .env
npm run dev   # http://localhost:8080
```

Форма на localhost не отправится без PHP-сервера — это нормально. Тестируйте форму на Timeweb после настройки.

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `VITE_SITE_URL` | Публичный URL сайта |

## Настройка формы на Timeweb

### 1. Создайте базу MySQL

В панели Timeweb: **Базы данных → MySQL → Создать**

Запишите: имя базы, пользователь, пароль, хост (обычно `localhost`).

### 2. Создайте таблицу

Откройте **phpMyAdmin** → выберите базу → вкладка **SQL** → вставьте содержимое файла `scripts/setup-database.sql` → Выполнить.

### 3. Настройте config.php

На сервере в папке `public_html/api/`:

1. Скопируйте `config.example.php` → `config.php`
2. Заполните данные БД и Telegram

`config.php` не попадает в git — загружается на сервер вручную (FTP или файловый менеджер Timeweb).

### 4. Telegram

- Создайте бота через @BotFather → получите токен
- Узнайте chat_id через `getUpdates` (см. инструкции в панели)

## Деплой

### GitHub Secrets

| Secret | Описание |
|--------|----------|
| `VITE_SITE_URL` | URL сайта |
| `FTP_SERVER` | Хост FTP Timeweb |
| `FTP_USERNAME` | Логин FTP |
| `FTP_PASSWORD` | Пароль FTP |
| `FTP_SERVER_DIR` | Путь к сайту (`/public_html/`) |

При push в `main` сайт собирается и загружается автоматически.

> **Важно:** `config.php` не перезаписывается при деплое — настройте его один раз вручную на сервере.

### Ручной деплой

```sh
npm run build
# Загрузите dist/ в public_html/
```

## Просмотр заявок

Заявки хранятся в таблице `form_submissions` — смотрите в phpMyAdmin на Timeweb.
