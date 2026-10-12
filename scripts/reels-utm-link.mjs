#!/usr/bin/env node
/**
 * Генерация UTM-ссылок для рилс-лендингов.
 *
 *   node scripts/reels-utm-link.mjs --page probnaya-razvod --platform instagram --reel basic --keyword ПРОБА
 *   node scripts/reels-utm-link.mjs --page sessiya-poterya --platform tiktok --medium bio --reel "emdr-razvod" --keyword СЕССИЯ
 */
import { parseArgs } from "node:util";

const BASE = "https://www.morozovanatalia.ru";

const PAGE_OFFER = {
  "probnaya-razvod": "proba",
  "probnaya-poterya": "proba",
  "sessiya-razvod": "sessiya",
  "sessiya-poterya": "sessiya",
};

const KEYWORD_PAGES = {
  ПРОБА: ["probnaya-razvod", "probnaya-poterya"],
  СЕССИЯ: ["sessiya-razvod", "sessiya-poterya"],
};

function slugifyReel(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

function buildLink({ page, platform, medium, reel, keyword }) {
  const offer = PAGE_OFFER[page];
  if (!offer) {
    throw new Error(`Неизвестная страница: ${page}`);
  }
  const plat = platform === "tiktok" ? "tiktok" : "instagram";
  const med =
    medium ||
    (plat === "instagram" ? "reels" : "bio");
  const content = slugifyReel(reel || "basic");
  const term = keyword ? String(keyword).trim().toUpperCase() : offer === "proba" ? "ПРОБА" : "СЕССИЯ";

  const params = new URLSearchParams({
    utm_source: plat,
    utm_medium: med,
    utm_campaign: offer,
    utm_content: content,
    utm_term: term,
  });

  return `${BASE}/${page}/?${params.toString()}`;
}

function printHelp() {
  console.log(`Использование:
  node scripts/reels-utm-link.mjs --page <probnaya-razvod|...> --platform <instagram|tiktok> [--medium reels|bio] [--reel название] [--keyword ПРОБА|СЕССИЯ]

  node scripts/reels-utm-link.mjs --table   # таблица basic для 4 страниц (IG reels + TikTok bio)

Страницы: ${Object.keys(PAGE_OFFER).join(", ")}
`);
}

function printTable() {
  const pages = Object.keys(PAGE_OFFER);
  console.log("| Платформа | Страница | Ссылка |");
  console.log("| --- | --- | --- |");
  for (const page of pages) {
    for (const platform of ["instagram", "tiktok"]) {
      const url = buildLink({ page, platform, reel: "basic" });
      const label = platform === "instagram" ? "Instagram (reels)" : "TikTok (bio)";
      console.log(`| ${label} | /${page}/ | ${url} |`);
    }
  }
}

const { values } = parseArgs({
  options: {
    page: { type: "string" },
    platform: { type: "string" },
    medium: { type: "string" },
    reel: { type: "string", default: "basic" },
    keyword: { type: "string" },
    table: { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});

if (values.help) {
  printHelp();
  process.exit(0);
}

if (values.table) {
  printTable();
  process.exit(0);
}

if (!values.page || !values.platform) {
  printHelp();
  process.exit(1);
}

if (values.keyword) {
  const kw = String(values.keyword).trim().toUpperCase();
  const pages = KEYWORD_PAGES[kw];
  if (pages && !values.page) {
    for (const p of pages) {
      console.log(buildLink({ page: p, platform: values.platform, medium: values.medium, reel: values.reel, keyword: kw }));
    }
    process.exit(0);
  }
}

console.log(
  buildLink({
    page: values.page,
    platform: values.platform,
    medium: values.medium,
    reel: values.reel,
    keyword: values.keyword,
  }),
);
