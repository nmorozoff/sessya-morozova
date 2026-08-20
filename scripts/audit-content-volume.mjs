/**
 * Content volume + forbidden-word audit (report only).
 *
 * MainBody (кластеры): intro + sections.paragraphs + list + trailingParagraphs
 * (без H2, geoBlock, FAQ, table, condition*).
 *
 * Запуск: node scripts/audit-content-volume.mjs
 */
import { createServer } from "vite";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { STATIC_SITE_ROUTES } from "./routes.mjs";

const ROOT = resolve(".");
const GEO_MIN = 40;
const GEO_MAX = 60;
const CLUSTER_MAINBODY_MIN = 1200;
const EMDR_MAINBODY_MIN = 1500;

const LEGAL_PAGE_FILES = {
  "/privacy": "src/pages/Privacy.tsx",
  "/privacy-policy": "src/pages/PrivacyPolicy.tsx",
  "/offer": "src/pages/Offer.tsx",
  "/advertising-consent": "src/pages/AdvertisingConsent.tsx",
};

function words(text) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
}

function grepForbidden(text) {
  const masked = text
    .replace(/лечащим врачом/gi, "___OK___")
    .replace(/извлечение/gi, "___OK___");
  const lechRe =
    /(?<![а-яё])лечен(?![а-яё])|(?<![а-яё])лечи[тм](?![а-яё])|(?<![а-яё])лечащ(?![а-яё])|(?<![а-яё])вылечи(?![а-яё])|(?<![а-яё])излечи(?![а-яё])/gi;
  const svoRe = /\bСВО\b|специальная военная операция/gi;
  const lech = [...masked.matchAll(lechRe)].map((m) => m[0]);
  const svo = [...text.matchAll(svoRe)].map((m) => m[0]);
  return { lech, svo };
}

function mainBodyFromPage(page) {
  const parts = [page.intro];
  for (const section of page.sections) {
    if (section.paragraphs) parts.push(...section.paragraphs);
    if (section.list) parts.push(...section.list);
    if (section.trailingParagraphs) parts.push(...section.trailingParagraphs);
  }
  return parts.join("\n");
}

function pageGrepText(page) {
  const parts = [
    page.h1,
    page.description,
    page.geoBlock,
    mainBodyFromPage(page),
    page.conditionName,
    page.conditionDescription,
    ...page.faq.flatMap((item) => [item.question, item.answer]),
    page.table.headers.join(" "),
    ...page.table.rows.flat().join(" "),
  ];
  return parts.join("\n");
}

function stripTsxToText(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{`([\s\S]*?)`\}/g, " $1 ")
    .replace(/\{[^}]+\}/g, " ")
    .replace(/["'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readResultsSectionText() {
  const path = resolve(ROOT, "src/components/ResultsSection.tsx");
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf8");
}

function formatGrep({ lech, svo }) {
  const parts = [];
  if (lech.length) parts.push(`леч*: ${[...new Set(lech)].join(", ")}`);
  if (svo.length) parts.push(`СВО: ${[...new Set(svo)].join(", ")}`);
  return parts.length ? parts.join("; ") : "—";
}

function mainBodyThreshold(route) {
  if (route === "/emdr-therapy") return EMDR_MAINBODY_MIN;
  return CLUSTER_MAINBODY_MIN;
}

function auditServicePage(route, page) {
  const mainBody = words(mainBodyFromPage(page));
  const geoWords = words(page.geoBlock);
  const threshold = mainBodyThreshold(route);
  const grep = grepForbidden(pageGrepText(page));

  const warnings = [];
  if (mainBody < threshold) warnings.push(`MainBody ${mainBody}<${threshold}`);
  if (geoWords < GEO_MIN || geoWords > GEO_MAX) warnings.push(`GEO ${geoWords}`);

  return {
    route,
    kind: "кластер",
    mainBody,
    mainBodyLabel: String(mainBody),
    mainBodyThreshold: `≥${threshold}`,
    geoWords,
    geoLabel: String(geoWords),
    grep: formatGrep(grep),
    warn: warnings.length ? `⚠️ ${warnings.join("; ")}` : "OK",
  };
}

function auditHome() {
  const resultsText = readResultsSectionText();
  const grep = grepForbidden(resultsText);
  return {
    route: "/",
    kind: "главная",
    mainBody: null,
    mainBodyLabel: "н/п",
    mainBodyThreshold: "—",
    geoWords: null,
    geoLabel: "н/п",
    grep: formatGrep(grep),
    warn: grep.lech.length || grep.svo.length ? `⚠️ grep` : "OK (grep «Что вы получите»)",
  };
}

function auditLegal(route) {
  const rel = LEGAL_PAGE_FILES[route];
  const path = resolve(ROOT, rel);
  const source = existsSync(path) ? readFileSync(path, "utf8") : "";
  const bodyText = stripTsxToText(source);
  const grep = grepForbidden(bodyText);
  const mainBody = words(bodyText);

  return {
    route,
    kind: "legal",
    mainBody,
    mainBodyLabel: String(mainBody),
    mainBodyThreshold: "н/п",
    geoWords: null,
    geoLabel: "н/п",
    grep: formatGrep(grep),
    warn: grep.lech.length || grep.svo.length ? "⚠️ grep" : "OK",
  };
}

function printTable(rows) {
  const header = [
    "Маршрут",
    "Тип",
    "MainBody",
    "Порог",
    "GEO",
    "GEO 40–60",
    "Grep",
    "Статус",
  ];
  const data = rows.map((r) => [
    r.route,
    r.kind,
    r.mainBodyLabel,
    r.mainBodyThreshold,
    r.geoLabel,
    r.geoWords == null ? "н/п" : r.geoWords >= GEO_MIN && r.geoWords <= GEO_MAX ? "OK" : "⚠️",
    r.grep,
    r.warn,
  ]);

  const widths = header.map((col, i) =>
    Math.max(col.length, ...data.map((row) => String(row[i]).length)),
  );

  const line = (cells) =>
    cells.map((cell, i) => String(cell).padEnd(widths[i])).join(" | ");

  console.log(line(header));
  console.log(widths.map((w) => "-".repeat(w)).join("-|-"));
  for (const row of data) console.log(line(row));
}

async function loadServicePages() {
  const server = await createServer({
    configFile: resolve(ROOT, "vite.config.ts"),
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "error",
  });

  try {
    const mod = await server.ssrLoadModule("/src/lib/services/content.ts");
    return mod.ALL_SERVICE_PAGES;
  } finally {
    await server.close();
  }
}

async function main() {
  const servicePages = await loadServicePages();
  const byRoute = new Map(servicePages.map((page) => [`/${page.slug}`, page]));

  const rows = [];
  let warnCount = 0;

  for (const route of STATIC_SITE_ROUTES) {
    let row;
    if (route === "/") {
      row = auditHome();
    } else if (LEGAL_PAGE_FILES[route]) {
      row = auditLegal(route);
    } else if (byRoute.has(route)) {
      row = auditServicePage(route, byRoute.get(route));
    } else {
      row = {
        route,
        kind: "?",
        mainBodyLabel: "—",
        mainBodyThreshold: "—",
        geoLabel: "—",
        geoWords: null,
        grep: "—",
        warn: "⚠️ нет конфига",
      };
    }
    if (String(row.warn).startsWith("⚠️")) warnCount += 1;
    rows.push(row);
  }

  const serviceCount = rows.filter((r) => r.kind === "кластер").length;
  const legalCount = rows.filter((r) => r.kind === "legal").length;

  console.log(`Аудит объёма контента — ${STATIC_SITE_ROUTES.length} маршрутов (${serviceCount} кластеров + ${legalCount} legal + главная)\n`);
  printTable(rows);
  console.log(`\nИтог: ⚠️ ${warnCount} из ${STATIC_SITE_ROUTES.length} маршрутов с замечаниями`);
  console.log(
    "Пороги: кластеры MainBody ≥1200; /emdr-therapy ≥1500; GEO 40–60 слов; grep леч*/СВО (кроме «лечащим врачом», «извлечение»).",
  );
}

main().catch((err) => {
  console.error("[audit-content-volume] Ошибка:", err);
  process.exit(1);
});
