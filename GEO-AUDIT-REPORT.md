# GEO Audit Report: Наталья Морозова — morozovanatalia.ru

**Audit Date:** 14 августа 2026  
**URL:** https://www.morozovanatalia.ru  
**Business Type:** Local Business (психолог, EMDR) + Publisher (блог) — **Hybrid**  
**Pages Analyzed:** 42 (из sitemap, лимит skill — 50)

**Метод:** live-crawl (HTTP + парсинг HTML), robots.txt, llms.txt, sitemap.xml, параллельный анализ по 5 GEO-направлениям.

---

## Executive Summary

**Overall GEO Score: 61/100 (Fair — умеренная GEO-готовность, есть серьёзные технические пробелы)**

Сильная сторона — **prerender кластерных страниц и блога** (2 000+ слов, FAQ, BlogPosting), плюс **качественный llms.txt**. Критические дыры: **главная без контента в HTML** (только SPA-shell 3,3 KB), **canonical блога указывает на главную** у 15+ статей, **3 битых URL в sitemap**, **www/non-www без единого редиректа**, **MedicalCondition** на всех кластерах вместо WebPage.

### Score Breakdown

| Category | Score | Weight | Weighted |
|---|---|---|---|
| AI Citability | 72/100 | 25% | 18.0 |
| Brand Authority | 52/100 | 20% | 10.4 |
| Content E-E-A-T | 76/100 | 20% | 15.2 |
| Technical GEO | 54/100 | 15% | 8.1 |
| Schema & Structured Data | 58/100 | 10% | 5.8 |
| Platform Optimization | 48/100 | 10% | 4.8 |
| **Overall GEO Score** | | | **61/100** |

---

## Приоритеты P0 / P1 / P2

### P0 — Критично (исправить немедленно)

| # | Проблема | Доказательство | Рекомендация |
|---|---|---|---|
| P0-1 | **Главная не пререндерится** — в HTML 0 слов, 0 H1, 0 JSON-LD | `GET /` → 3320 B, `word_count: 0`, `schema_count: 0` | Добавить `/` в prerender pipeline; проверить, что `dist/index.html` содержит Hero + FAQ + schema после `npm run build` |
| P0-2 | **Canonical блога → главная** (15 статей) | `/blog/generalizovannoe-trevozhnoe-rasstroystvo-psiholog` canonical = `https://morozovanatalia.ru/` | Исправить `PageMeta`/`path` в `BlogPost.tsx` и prerender; canonical = self URL с `www` |
| P0-3 | **Битые URL в sitemap** | `502` depersonalizaciya…; timeout emotsionalnoe-vygoranie…, psikhosomatika… | Пересобрать prerender + полный FTP deploy всех `blog/*/index.html`; проверить 200 на все 18 slug |
| P0-4 | **Редирект HTTPS → HTTP** на части блога | `301` `https://www…/blog/emotsionalnoe-vygoranie…` → `http://www…/…/` | Настроить Timeweb/nginx: всегда HTTPS, без downgrade; trailing slash policy единообразно |
| P0-5 | **www и non-www оба отдают 200** | `morozovanatalia.ru` и `www.morozovanatalia.ru` — оба 200, одинаковый SPA-shell | 301 с bare domain → `https://www.morozovanatalia.ru`; `VITE_SITE_URL=https://www.morozovanatalia.ru` в CI |
| P0-6 | **Schema на главной только через JS** | Person + ProfessionalService + FAQ в React, не в статическом HTML | Prerender главной или inject JSON-LD в `index.html` template |

### P1 — Высокий (1 неделя)

| # | Проблема | Доказательство | Рекомендация |
|---|---|---|---|
| P1-1 | **MedicalCondition на 18 кластерах** | emdr-therapy, panic-attacks, … — все с `MedicalCondition` | Заменить на `WebPage` + `about` по `docs/schema-templates.md` |
| P1-2 | **Тонкий контент** | `/anxiety` — 332 слова (цель ≥1200) | Расширить по `docs/content-template.md` |
| P1-3 | **Дублирование title в блоге** | «…МорозоваНаталья Морозова — Психолог» | Убрать дубль бренда в `<title>` шаблона BlogPost |
| P1-4 | **Canonical без www** на главной, блоге, 15 статьях | `https://morozovanatalia.ru/` | Единый `SITE_URL` с www во всех env |
| P1-5 | **Нестабильный деплой** | 502/timeout на отдельных файлах; WebFetch 503/500 эпизодически | `FORCE_DEPLOY=1` + verify all sitemap URLs 200 после каждого деплоя |
| P1-6 | **Sitemap не переотправлен** | Чеклист `geo-seo-checklist.md` — открыт | Переотправить в Яндекс.Вебмастер и GSC после P0 |

### P2 — Средний (1 месяц)

| # | Проблема | Рекомендация |
|---|---|---|
| P2-1 | BreadcrumbList только на 17/38 страниц | Добавить на все кластеры, блог, legal |
| P2-2 | llms.txt без раздела «Блог» | Добавить 5–10 ключевых статей с URL |
| P2-3 | robots.txt без явных AI-crawlers | Добавить `Allow` для GPTBot, ClaudeBot, PerplexityBot, Yandex |
| P2-4 | Brand Authority слабая (52/100) | ProDoctorov, Яндекс Бизнес, 2GIS, Zen — единый NAP + ссылки на сайт |
| P2-5 | `/privacy` — 620 слов, без PageMeta schema | Добавить PageMeta + минимальный WebPage schema |
| P2-6 | CWV не измерены автоматически | PageSpeed Insights / Lighthouse на главной и топ-кластерах |
| P2-7 | Скрипт `audit-live.mjs` отсутствует | Автопроверка sitemap → 200 + canonical + size > 10KB |

---

## Critical Issues (skill severity)

1. **Главная — JS-only для AI-краулеров без рендера** → контент и entity graph невидимы в первом ответе сервера.
2. **15 блог-постов с canonical на главную** → риск деиндексации статей, каннибализация с `/`.
3. **3 URL из sitemap недоступны или нестабильны** → crawl errors в Вебмастере.
4. **Дублирование домена www/non-www** → размытие link equity.

## High Priority Issues

- MedicalCondition на всех сервисных страницах (YMYL-риск, не по гайду проекта).
- Тонкая страница `/anxiety` (332 слова vs цель 1200+).
- Canonical inconsistency (www vs non-www, blog → home).
- Частичные FTP-деплои → пустые/битые чанки и HTML.

## Medium Priority Issues

- llms.txt не ссылается на блог.
- Нет явных правил для AI-ботов в robots.txt.
- Title-дубли в блоге.
- Неполный BreadcrumbList.

## Low Priority Issues

- `/advertising-consent` — 346 слов (достаточно для legal).
- OG-теги в целом присутствуют на prerender-страницах.
- Внутренняя перелинковка на кластерах ~21 ссылка — хорошо.

---

## Category Deep Dives

### AI Citability — 72/100

**Сильное:**
- Кластеры EMDR, паника, фобии — 2 000+ слов, FAQ-блоки, самодостаточные ответы.
- Блог — ~1 140 слов в prerender, BlogPosting schema, структура H2/H3.
- llms.txt — чёткие answer blocks: метод, цены, адреса, список услуг.

**Слабое:**
- Главная пустая в HTML — главный entry point для AI не цитируем.
- `/anxiety` — 332 слова, недостаточно для извлечения ответов.
- Canonical блога → главная — AI может считать статьи дублями главной.

**Quick rewrite:** добавить на главную (в prerender) блок 40–60 слов: «Наталья Морозова — сертифицированный психолог, EMDR-терапевт в Москве. Метод EMDR рекомендован ВОЗ для работы с ПТСР, паническими атаками и травмой. Онлайн от 5 000 ₽, очно от 6 500 ₽.»

### Brand Authority — 52/100

**Сильное:**
- Единый бренд на сайте, llms.txt, профессиональный тон.
- EMDR + ВОЗ упоминания на кластерах.

**Слабое:**
- Нет Wikipedia-статьи (нормально для частного практика).
- Требуется усиление: ProDoctorov, Яндекс.Карты/Бизнес, отзывы, Zen, YouTube explainer.
- Слабая связка «сущность бренда» ↔ внешние источники для AI entity graph.

### Content E-E-A-T — 76/100

**Сильное:**
- Реальные фото, кабинеты, цены, оферта, privacy.
- FAQ на главной (в React) и кластерах (в HTML).
- Блог с авторством, BlogPosting + Person.

**Слабое:**
- Credentials на главной не в первом HTML-ответе.
- Нет явной страницы «Об авторе» с полным CV/сертификатами.
- `/anxiety` и legal-страницы тоньше эталона.

### Technical GEO — 54/100

| Проверка | Статус |
|---|---|
| robots.txt Allow: / | ✅ |
| AI crawlers explicit | ⚠️ не указаны (дефолт Allow) |
| llms.txt | ✅ 200, качественный |
| sitemap.xml | ✅ 200, 42 URL |
| Prerender кластеров | ✅ ~45–115 KB HTML |
| Prerender главной | ❌ 3,3 KB shell |
| Prerender блога | ✅ 64 KB index, ~115 KB статьи |
| HTTPS | ⚠️ downgrade на части блог-URL |
| www canonical | ❌ inconsistent |
| Битые URL | ❌ 3 из 42 |

**Инфраструктура:** nginx/Timeweb, SPA fallback в `.htaccess`, SSG для части маршрутов.

### Schema & Structured Data — 58/100

| Страница | Найдено | Проблемы |
|---|---|---|
| `/` | 0 в HTML | Schema только client-side |
| `/emdr-therapy` | MedicalCondition, PsychologicalTreatment, FAQPage, BreadcrumbList | MedicalCondition → заменить |
| `/panic-attacks` | то же | то же |
| `/blog` | WebPage/Blog | canonical без www |
| `/blog/…/gtr` | BlogPosting, Person, ProfessionalService, FAQPage | **canonical → /** |

**Отсутствует:** единый Person на всех страницах в static HTML; WebPage на кластерах по гайду.

### Platform Optimization — 48/100

- llms.txt — сильный сигнал для Perplexity/ChatGPT/Яндекс Нейро.
- Нет системной работы с агрегаторами (ProDoctorov, Zoon, 2GIS).
- YouTube/Reddit/Wikipedia — слабое или отсутствующее присутствие.
- Для запросов «психолог EMDR Москва» сайт конкурирует с агрегаторами без внешних якорей.

---

## Quick Wins (эта неделя)

1. **Prerender главной** — +15–20 пунктов Technical GEO и Citability.
2. **Исправить canonical в BlogPost** — self-referencing с `https://www.…`.
3. **Полный redeploy 3 битых блог-URL** — убрать crawl errors.
4. **301 bare → www + только HTTPS** — на Timeweb.
5. **Заменить MedicalCondition → WebPage** на одном пилотном кластере, затем roll-out.

---

## 30-Day Action Plan

### Week 1: Технический фундамент (P0)
- [ ] Prerender `/` с Person + ProfessionalService + FAQPage в HTML
- [ ] Fix blog canonical + `VITE_SITE_URL`
- [ ] Redeploy all blog prerender files; verify 42/42 URLs → 200
- [ ] HTTPS + www redirect на хостинге
- [ ] Переотправить sitemap в Вебмастер и GSC

### Week 2: Schema & контент (P1)
- [ ] MedicalCondition → WebPage на всех кластерах
- [ ] Расширить `/anxiety` до 1200+ слов
- [ ] Fix blog `<title>` template
- [ ] BreadcrumbList на оставшихся страницах

### Week 3: GEO & платформы (P2)
- [ ] Обновить llms.txt — добавить блог + новые кластеры
- [ ] robots.txt — явные Allow для AI-ботов
- [ ] ProDoctorov / Яндекс Бизнес / 2GIS — единый NAP

### Week 4: Автоматизация
- [ ] Скрипт `audit-live.mjs` в CI post-deploy
- [ ] Lighthouse на главной + 3 кластера
- [ ] Повторный GEO audit — цель ≥75/100

---

## Appendix: Pages Analyzed

| URL | Status | Size | Words | GEO Issues |
|---|---|---|---|---|
| `/` | 200 | 3.3 KB | 0 | P0: no prerender, no schema, wrong canonical |
| `/emdr-therapy` | 200 | 54 KB | 2124 | P1: MedicalCondition |
| `/panic-attacks` | 200 | 47 KB | ~2000 | P1: MedicalCondition |
| `/anxiety` | 200 | 46 KB | **332** | P1: thin content |
| `/blog` | 200 | 64 KB | — | P1: canonical no-www |
| `/blog/generalizovannoe-trevozhnoe-rasstroystvo-psiholog` | 200 | 116 KB | 1144 | **P0: canonical → /** |
| `/blog/depersonalizaciya-derealizaciya-trevoga-psiholog` | **502** | 0 | 0 | **P0: broken** |
| `/blog/emotsionalnoe-vygoranie-predprinimateley` | **timeout/301→http** | 51 B | 0 | **P0: broken** |
| `/blog/psikhosomatika-stress-telo` | **timeout** | 51 B | 0 | **P0: broken** |
| Остальные 33 URL из sitemap | 200 | 41–50 KB | 1200–2300 | P1: MedicalCondition (кластеры) |

**Crawl stats:** 39/42 OK · 1×502 · 2×timeout · 19/38 страниц ≥1200 слов · 17/38 с BreadcrumbList · 15/18 блог-постов с BlogPosting

---

*Отчёт сгенерирован по workflow geo-audit skill. Live-crawl: 14.08.2026, UTC+3.*
