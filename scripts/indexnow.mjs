#!/usr/bin/env node
/**
 * IndexNow — уведомление Bing / Yandex об изменённых URL.
 * @see https://www.indexnow.org/documentation
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITEMAP = resolve(ROOT, "public/sitemap.xml");
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

export const INDEXNOW_KEY = "f471a1c083c24b2493c8a45b17101fc2";
export const INDEXNOW_KEY_FILE = `${INDEXNOW_KEY}.txt`;

function normalizeSiteUrl(raw) {
  const u = new URL(raw.endsWith("/") ? raw : `${raw}/`);
  return u.href;
}

function hostFromSiteUrl(siteUrl) {
  return new URL(siteUrl).host;
}

function keyLocation(siteUrl) {
  return `${normalizeSiteUrl(siteUrl)}${INDEXNOW_KEY_FILE}`;
}

function parseSitemap(path) {
  const xml = readFileSync(path, "utf8");
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  return urls;
}

function filterBlogUrls(urls, slug) {
  if (!slug) return urls;
  const prefix = `/blog/${slug}/`;
  return urls.filter((u) => u.includes(prefix));
}

/**
 * @param {string[]} urlList
 * @param {string} siteUrl e.g. https://www.morozovanatalia.ru/
 */
export async function submitIndexNow(urlList, siteUrl) {
  if (process.env.INDEXNOW_DISABLE === "1") {
    return { skipped: true, reason: "INDEXNOW_DISABLE=1" };
  }
  const site = normalizeSiteUrl(siteUrl);
  const host = hostFromSiteUrl(site);
  const unique = [...new Set(urlList.map((u) => u.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return { skipped: true, reason: "empty url list" };
  }

  const body = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: keyLocation(site),
    urlList: unique,
  };

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let payload = text;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    // plain text response
  }

  return {
    ok: res.status === 200 || res.status === 202,
    httpStatus: res.status,
    urlCount: unique.length,
    keyLocation: body.keyLocation,
    response: payload || text || null,
  };
}

export async function submitIndexNowFromSitemap(siteUrl, { slug } = {}) {
  if (!existsSync(SITEMAP)) {
    throw new Error(`sitemap not found: ${SITEMAP}`);
  }
  let urls = parseSitemap(SITEMAP);
  urls = filterBlogUrls(urls, slug);
  return submitIndexNow(urls, siteUrl);
}

async function loadSiteUrlFromDeployEnv() {
  const envPath = resolve(ROOT, ".ftp-deploy.env");
  if (!existsSync(envPath)) {
    return process.env.VITE_SITE_URL || "https://www.morozovanatalia.ru/";
  }
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (t.startsWith("VITE_SITE_URL=")) {
      return t.split("=", 2)[1].trim();
    }
  }
  return "https://www.morozovanatalia.ru/";
}

async function main() {
  const { values } = parseArgs({
    options: {
      sitemap: { type: "boolean", default: false },
      slug: { type: "string" },
      url: { type: "string", multiple: true },
    },
    allowPositionals: false,
  });

  const siteUrl = await loadSiteUrlFromDeployEnv();

  let result;
  if (values.url?.length) {
    result = await submitIndexNow(values.url, siteUrl);
  } else if (values.sitemap) {
    result = await submitIndexNowFromSitemap(siteUrl, { slug: values.slug });
  } else {
    console.error("Usage: node scripts/indexnow.mjs --sitemap [--slug=...] | --url URL...");
    process.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
  if (result.skipped) process.exit(0);
  process.exit(result.ok ? 0 : 1);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  main().catch((err) => {
    console.error("[indexnow] ERROR:", err.message || err);
    process.exit(1);
  });
}
