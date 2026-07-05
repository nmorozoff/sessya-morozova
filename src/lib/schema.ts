import { SITE_URL } from "@/lib/site";

export const EMDR_TREATMENT = {
  "@type": "PsychologicalTreatment" as const,
  name: "EMDR-терапия (десенсибилизация и переработка движением глаз)",
  alternateName: "ДПДГ",
  description:
    "Нейробиологический метод психотерапии, рекомендованный ВОЗ для работы с ПТСР. Переработка травматического опыта через билатеральную стимуляцию.",
  url: `${SITE_URL}/emdr-therapy`,
};

export const PRICING_OFFERS = [
  {
    "@type": "Offer" as const,
    name: "Онлайн-консультация",
    description: "Психологическая сессия онлайн, 90 минут",
    price: "5000",
    priceCurrency: "RUB",
  },
  {
    "@type": "Offer" as const,
    name: "Очная сессия в Москве",
    description: "Психологическая сессия в кабинете, 90 минут",
    price: "6500",
    priceCurrency: "RUB",
  },
  {
    "@type": "Offer" as const,
    name: "Первая ознакомительная встреча",
    description: "Онлайн-знакомство, 30 минут",
    price: "0",
    priceCurrency: "RUB",
  },
];

export const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Наталья Морозова",
  jobTitle: "EMDR-терапевт (ДПДГ)",
  url: SITE_URL,
  image: `${SITE_URL}/images/about-photo-dark.jpg`,
  knowsAbout: [
    "EMDR-терапия",
    "ПТСР",
    "панические атаки",
    "тревожные расстройства",
    "фобии",
    "психосоматика",
    "выгорание",
    "бизнес-психология",
    "РПП",
    "горевание",
    "психологическая травма",
  ],
  sameAs: [] as string[],
};

const OFFICE_LOCATIONS = [
  {
    "@type": "Place" as const,
    name: "Кабинет психолога — м. Тургеневская / Чистые пруды",
    description: "Очный приём, 2 мин от метро",
    address: {
      "@type": "PostalAddress" as const,
      addressLocality: "Москва",
      addressCountry: "RU",
    },
  },
  {
    "@type": "Place" as const,
    name: "Кабинет психолога — м. Ботанический сад МЦК",
    description: "Очный приём, 2 мин от метро",
    address: {
      "@type": "PostalAddress" as const,
      addressLocality: "Москва",
      addressCountry: "RU",
    },
  },
];

export const professionalServiceSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Психологическое консультирование — Наталья Морозова",
  serviceType: "Психологическое консультирование",
  url: SITE_URL,
  description:
    "EMDR-терапия (ДПДГ) и психологическое консультирование онлайн и очно в Москве. Работа с тревогой, травмой, фобиями, выгоранием.",
  provider: {
    "@type": "Person",
    name: "Наталья Морозова",
    jobTitle: "EMDR-терапевт (ДПДГ)",
  },
  areaServed: [
    { "@type": "City", name: "Москва" },
    { "@type": "Country", name: "Россия" },
  ],
  offers: PRICING_OFFERS,
  location: OFFICE_LOCATIONS,
};

/** @deprecated Использовать personSchema + professionalServiceSchema */
export const physicianSchema = personSchema;

export const homepageFaqItems = [
  {
    question: "Что такое метод EMDR (ДПДГ) и как он помогает при психологических травмах?",
    answer:
      "EMDR (десенсибилизация и переработка движением глаз) — нейробиологический метод психотерапии для устранения последствий травматического стресса. Попеременная стимуляция полушарий мозга активирует естественную переработку информации и снижает эмоциональную остроту травмы, фобии или кризиса без многолетнего анализа прошлого.",
  },
  {
    question: "Насколько эффективна терапия онлайн в сравнении с очными приёмами?",
    answer:
      "EMDR-терапия в онлайн-формате доказала полную эквивалентность очным сессиям. Используются визуальные программы для билатеральной стимуляции и техники самопостукивания (тапинг). Возможна работа из любой точки мира или очный приём в Москве (м. Тургеневская / Чистые пруды, м. Ботанический сад МЦК).",
  },
  {
    question: "Какова стоимость консультации психолога?",
    answer:
      "Онлайн-сессия (90 минут) — 5 000 ₽. Очная сессия в Москве (90 минут) — 6 500 ₽. Для новых клиентов — бесплатная ознакомительная онлайн-сессия 30 минут.",
  },
  {
    question: "Помогает ли психолог при выгорании и синдроме самозванца у владельцев бизнеса?",
    answer:
      "Да. Кризисы в бизнесе, страх делегирования и перфекционизм часто базируются на глубинных убеждениях и системных сбоях в психике. Работа с предпринимателями методом EMDR выявляет точки напряжения и перерабатывает их, возвращая ресурсное состояние.",
  },
  {
    question: "Сколько сессий потребуется для избавления от панических атак или фобии?",
    answer:
      "Для проработки единичной фобии или недавней травмы обычно требуется 1–2 сессии. При комплексном ПТСР работа длится дольше, но снижение тревоги отмечается уже после первых сеансов.",
  },
];

export function buildFaqPageSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export const faqPageSchema = buildFaqPageSchema(homepageFaqItems);

export function buildBreadcrumbSchema(pageName: string, path: string) {
  const pageUrl = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Главная",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: pageName,
        item: pageUrl,
      },
    ],
  };
}

export function medicalConditionSchema(
  name: string,
  description: string,
  pageUrl: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalCondition",
    name,
    description,
    url: pageUrl,
    possibleTreatment: {
      ...EMDR_TREATMENT,
      url: `${SITE_URL}/emdr-therapy`,
    },
  };
}
