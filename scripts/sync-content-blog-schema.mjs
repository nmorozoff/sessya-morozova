/** Sync FAQPage + meta description into each content/blog slug schema.jsonld. */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { mergeSchemaWithFaq } from "./blog-schema-faq.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const CONTENT_DIR = resolve(ROOT, "content/blog");
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

function excerptFromHtml(html, maxLength = 160) {
  const text = stripHtml(html);
  if (!text) return "";
  if (text.length <= maxLength) return text;
  let cut = text.slice(0, maxLength - 1).trimEnd();
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > 40) cut = cut.slice(0, lastSpace);
  return `${cut.replace(/[.,;:-]+$/, "")}…`;
}

let updated = 0;
let skipped = 0;

for (const entry of readdirSync(CONTENT_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
  const dir = resolve(CONTENT_DIR, entry.name);
  const schemaPath = resolve(dir, "schema.jsonld");
  const htmlPath = resolve(dir, "article.html");
  if (!existsSync(schemaPath) || !existsSync(htmlPath)) {
    skipped += 1;
    continue;
  }
  const slug = entry.name;
  const html = readFileSync(htmlPath, "utf8");
  const description = excerptFromHtml(html, 160);
  const next = mergeSchemaWithFaq(readFileSync(schemaPath, "utf8"), html, {
    slug,
    siteUrl: SITE_URL,
    description,
  });
  writeFileSync(schemaPath, next, "utf8");
  updated += 1;
}

console.log(`[schema-sync] updated ${updated}, skipped ${skipped}`);
