/**
 * Regenerate public/llms.txt from content/blog for LLM crawlers.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const CONTENT_DIR = resolve(ROOT, "content/blog");
const OUT_PATH = resolve(ROOT, "public/llms.txt");
const SITE_URL = (process.env.VITE_SITE_URL || "https://www.morozovanatalia.ru")
  .replace(/\/$/, "")
  .replace(/^http:\/\//i, "https://")
  .replace(/^https:\/\/morozovanatalia\.ru$/i, "https://www.morozovanatalia.ru");

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(html, max = 140) {
  const text = stripHtml(html);
  if (text.length <= max) return text;
  let cut = text.slice(0, max - 1).trimEnd();
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > 50) cut = cut.slice(0, lastSpace);
  return `${cut.replace(/[.,;:-]+$/, "")}…`;
}

function loadPosts() {
  const posts = [];
  for (const entry of readdirSync(CONTENT_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const dir = resolve(CONTENT_DIR, entry.name);
    const metaPath = resolve(dir, "article.meta.json");
    const htmlPath = resolve(dir, "article.html");
    if (!existsSync(metaPath) || !existsSync(htmlPath)) continue;
    const meta = JSON.parse(readFileSync(metaPath, "utf8"));
    const html = readFileSync(htmlPath, "utf8");
    const title =
      meta.title ||
      meta.meta_ab?.title_seo ||
      meta.h1 ||
      entry.name;
    const publishedAt =
      meta.publishedAt || meta.published_at || meta.date || "1970-01-01";
    posts.push({
      slug: meta.slug || entry.name,
      title,
      description: excerpt(html),
      publishedAt,
      grief: entry.name.startsWith("gore-"),
    });
  }
  posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));
  return posts;
}

function linesForPosts(posts) {
  return posts.map(
    (p) =>
      `- [${p.title}](${SITE_URL}/blog/${p.slug}/): ${p.description}`,
  );
}

function main() {
  const posts = loadPosts();
  const griefPosts = posts.filter((p) => p.grief);
  const emdrPosts = posts.filter((p) => !p.grief);

  const lines = [
    "# Наталья Морозова — Психолог, EMDR-терапевт",
    "",
    "> Сертифицированный психолог и EMDR-терапевт в Москве и онлайн. Работа с тревогой, паническими атаками, фобиями, ПТСР, гореванием и утратой, психосоматикой и выгоранием. Метод EMDR (ДПДГ) рекомендован ВОЗ.",
    "",
    "## Контакты",
    "",
    `- [Сайт](${SITE_URL}/): Запись на консультацию (форма на главной)`,
    "- WhatsApp: https://wa.me/79295940514 — запись на консультацию",
    "- MAX: https://max.ru/u/f9LHodD0cOLMWn4dwsfNLXttuTDjJTF4cCK2MJPjCfNpeKrbfQ6RlQy3dLk — запись на консультацию",
    "- Telegram: https://t.me/natalyamorozovaa — запись на консультацию",
    "- [Профиль b17.ru](https://www.b17.ru/morozova_natalia/): Психолог, EMDR, Москва",
    "- [Дзен](https://dzen.ru/morozova_emdr): Статьи о психологии и EMDR",
    "",
    "## Услуги",
    "",
    `- [EMDR-терапия](${SITE_URL}/emdr-therapy): Метод ДПДГ, 8 фаз, кому подходит`,
    `- [Горевание и утрата](${SITE_URL}/grief/): Поддержка при потере близкого и несвязанных утрат`,
    `- [Психологическая травма](${SITE_URL}/psychological-trauma): Виды травмы, симптомы, переработка EMDR`,
    `- [Панические атаки](${SITE_URL}/panic-attacks): Симптомы, причины, работа с тревогой`,
    `- [Фобии и страхи](${SITE_URL}/phobias): Избегание, травматический корень страха`,
    `- [Тревожность и ГТР](${SITE_URL}/anxiety): Хроническая тревога, GAD-7`,
    `- [ПТСР](${SITE_URL}/ptsd): Посттравматический стресс`,
    `- [Психосоматика](${SITE_URL}/psychosomatics): Связь стресса и тела`,
    `- [Бизнес-психология](${SITE_URL}/business-psychology): Выгорание предпринимателей`,
    "",
    "## Блог — EMDR, тревога, травма",
    "",
    `- [Все статьи блога](${SITE_URL}/blog): ${posts.length} материалов (${emdrPosts.length} о тревоге/EMDR, ${griefPosts.length} о горевании)`,
    ...linesForPosts(emdrPosts),
    "",
    "## Блог — горевание и потеря (EMDR)",
    "",
    `- [Страница кластера «Горевание»](${SITE_URL}/grief/): когда и как подключать психолога при утрате`,
    ...linesForPosts(griefPosts),
    "",
    "## Форматы и цены",
    "",
    "Онлайн-консультация (90 мин): 5 000 ₽. Очная сессия в Москве (90 мин): 6 500 ₽. Бесплатная ознакомительная встреча: 30 мин.",
    "",
    "Очные кабинеты: м. Тургеневская / Чистые пруды, м. Ботанический сад МЦК (2 мин от метро).",
    "",
  ];

  writeFileSync(OUT_PATH, `${lines.join("\n")}\n`, "utf8");
  console.log(
    `[llms.txt] ${posts.length} post(s) → public/llms.txt (grief: ${griefPosts.length}, emdr: ${emdrPosts.length})`,
  );
}

main();
