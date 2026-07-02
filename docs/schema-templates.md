# Шаблоны JSON-LD (Schema.org)

**Эталон.** Не использовать `Physician`, `MedicalBusiness`, `MedicalCondition` — психолог/психотерапевт, не врач.

## Главная страница `/`

Два отдельных скрипта (через `PageMeta` → `jsonLd`):

### Person (Наталья Морозова)
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Наталья Морозова",
  "jobTitle": "EMDR-терапевт (ДПДГ)",
  "url": "https://www.morozovanatalia.ru",
  "image": "https://www.morozovanatalia.ru/images/about-photo-dark.jpg",
  "knowsAbout": ["EMDR-терапия", "ПТСР", "панические атаки", "..."],
  "sameAs": []
}
```

### ProfessionalService
```json
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Психологическое консультирование — Наталья Морозова",
  "serviceType": "Психологическое консультирование",
  "url": "https://www.morozovanatalia.ru",
  "provider": { "@type": "Person", "name": "Наталья Морозова" },
  "areaServed": [{ "@type": "City", "name": "Москва" }, { "@type": "Country", "name": "Россия" }],
  "offers": [ ... ],
  "location": [ кабинеты м. Тургеневская, м. Ботанический сад ]
}
```

### FAQPage (главная)
Отдельный скрипт из `homepageFaqItems`.

---

## Кластерные страницы `/slug`

Минимум на **новых** страницах:
1. `FAQPage`
2. `BreadcrumbList`

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Главная", "item": "https://www.morozovanatalia.ru/" },
    { "@type": "ListItem", "position": 2, "name": "Название страницы", "item": "https://www.morozovanatalia.ru/slug" }
  ]
}
```

### EMDR как метод (не медицинский тип)
На страницах запросов — ссылка текстом + внутренняя ссылка на `/emdr-therapy`.  
Тип `PsychologicalTreatment` — **не использовать** до отдельного согласования (медицинская семантика).

---

## Устаревшее (удалить при рефакторинге)
- `Physician` — снято с главной
- `MedicalCondition` на кластерных — заменить на `WebPage` + `FAQPage` + `BreadcrumbList` (отдельный проход)

## Реализация в коде
- `src/lib/schema.ts` — фабрики схем
- `PageMeta` — проп `jsonLd?: object | object[]`, рендер `<script type="application/ld+json">` на каждый объект
