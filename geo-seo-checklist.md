Чек-лист реализации GEO & SEO

## Шаг 1: Базовая инфраструктура
[x] SEO-маршрутизация: чистые URL (`/panic-attacks`, `/phobias`), навигация через `<a href>` (React Router `Link` → `<a>`).
[x] Yandex Rotor: `window.YandexRotorSettings = { WaiterEnabled: true }` в `<head>`, `IsLoaded = true` после гидратации (`YandexRotorReady`).
[x] JSON-LD `Physician` на главной: имя, специализация, кабинеты (м. Тургеневская, м. Ботанический сад), цены (5000 / 6500).
[x] Файл `/llms.txt` доступен в корне сайта.

## Техническая база
[x] Шаг 1: Настроен build-time prerender (SSG) при сборке — статический HTML для всех маршрутов.

[x] Шаг 1: Настроены статические URL (без #) для всех услуг.

[x] Шаг 1: Настроена кастомная страница 404.

[x] Шаг 2: Внедрен скрипт window.YandexRotorSettings.

[x] Шаг 2: Все элементы навигации переведены на теги <a> с href.

[x] Шаг 3: Внедрена микроразметка JSON-LD Physician на главную страницу.

[x] Шаг 3: Внедрена разметка MedicalCondition + possibleTreatment на страницы услуг.

[x] Шаг 3: Внедрена разметка FAQPage.

[x] Шаг 4: Структура страниц переделана под "Слоеный пирог" (H1 -> GEO-ответ 50 слов -> SEO-текст -> Таблицы -> FAQ).

[x] Шаг 5: Создан и заполнен файл llms.txt в корне сайта.

[x] Шаг 5: Изображения оптимизированы (добавлены alt теги).

[x] Шаг 6: Исправлен sitemap.xml и robots.txt — домен morozovanatalia.ru.

[x] Шаг 6: Уникальные title/description/canonical на каждой странице (PageMeta).

## Чек-лист создания посадочных страниц (SEO + GEO)
[x] Базовая настройка: YandexRotorSettings, llms.txt, Schema Physician.

[x] Страница: Панические атаки (/panic-attacks)

[x] Страница: Фобии и страхи (/phobias) - с учетом клаустрофобии, агорафобии, аэрофобии.

[x] Страница: Горевание и потеря (/grief)

[x] Страница: Развод и расставание (/divorce)

[x] Страница: Сексуальное насилие (/sexual-abuse)

[x] Страница: Эмоциональное насилие и абьюз (/emotional-abuse)

[x] Страница: Тревожность и ГТР (/anxiety)

[x] Страница: РПП (/eating-disorders)

[x] Страница: Психосоматика и аллергии (/psychosomatics)

[x] Страница: Бизнес-психология (/business-psychology) - стресс, кассовые разрывы.

[x] Страница: EMDR-терапия (/emdr-therapy)
