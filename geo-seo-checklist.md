# Чек-лист GEO & SEO

## ЭТАП 0 — Инфраструктура и источники правды
[x] Создана папка `docs/` (site-map, content-template, schema-templates, seo-geo-glossary, reviews-and-credentials, zen-articles-plan)
[x] Зафиксированы эталоны: GEO 40–60 слов, SEO ≥1200 слов (метод 1500+), Person + ProfessionalService (без Physician)
[x] `PageMeta` расширен: проп `jsonLd` (массив объектов → отдельные `<script type="application/ld+json">`)
[x] Главная: снят Physician, подключены Person + ProfessionalService + FAQPage через PageMeta
[ ] Prerender (SSG): починить до финальной технической проверки и отправки sitemap в Вебмастер

## Шаг 1: Базовая инфраструктура (ранее)
[x] SEO-маршрутизация: чистые URL, навигация через `<a href>`
[x] Yandex Rotor: WaiterEnabled + IsLoaded после гидратации
[x] JSON-LD на главной (обновлено: Person + ProfessionalService)
[x] `/llms.txt` доступен

## Контент кластерных страниц (следующие этапы)
[ ] Расширить опубликованные страницы до ≥1200 слов по `docs/content-template.md`
[ ] Создать 8 новых кластеров из `docs/site-map.md` (ptsd, ocd, …)
[ ] На новых страницах: BreadcrumbList, figcaption, два CTA, FAQPage

## Финальный технический чек-лист (перед сдачей)
[ ] PageMeta на `/privacy` и `/offer`
[ ] BreadcrumbList + figcaption на существующих страницах (главная, метод, сервисные)
[ ] Prerender работает на всех маршрутах — уникальный title/description в HTML
[ ] Sitemap переотправлен в Яндекс.Вебмастер и Google Search Console
[ ] Убрать MedicalCondition с кластерных (заменить на WebPage) — по docs/schema-templates.md

## Опубликованные кластеры (нужно расширить)
[ ] `/emdr-therapy` (1500+ слов)
[ ] `/panic-attacks` `/phobias` `/anxiety` `/grief` `/divorce`
[ ] `/sexual-abuse` `/emotional-abuse` `/eating-disorders` `/psychosomatics` `/business-psychology`

## Планируемые кластеры
[ ] `/ptsd` `/psychological-trauma` `/ocd` `/emigration-trauma`
[ ] `/dissociation` `/complex-trauma` `/burnout` `/parent-relationships`
