import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { SITE_ROUTES } from "./routes.mjs";
import { canonicalLoc, normalizeSiteUrl, withTrailingSlash } from "./url-utils.mjs";

if (process.env.SKIP_PRERENDER === "1" || process.env.EXCALIBUR_REACT_SKIP_PRERENDER === "yes") {
  console.log("[prerender] SKIP_PRERENDER — пропуск (vite dist без puppeteer)");
  process.exit(0);
}

const DIST = resolve("dist");
const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;
const SITE_URL = normalizeSiteUrl(process.env.VITE_SITE_URL);

const MIN_BLOG_H2 = Number(process.env.PRERENDER_BLOG_MIN_H2 || 5);
const MIN_BLOG_BODY_CHARS = Number(process.env.PRERENDER_BLOG_MIN_BODY_CHARS || 2000);
const MIN_BLOG_ARTICLE_CHARS = Number(process.env.PRERENDER_BLOG_MIN_CHARS || 3000);
/** Путь только для puppeteer — не входит в SITE_ROUTES и не деплоится как URL */
const NOT_FOUND_PRERENDER_PATH = "/__prerender-not-found__/";

function canonicalForRoute(route) {
  return canonicalLoc(SITE_URL, route);
}

function isBlogPostRoute(route) {
  return route.startsWith("/blog/") && route !== "/blog" && !route.startsWith("/blog/page/");
}

function startPreview() {
  return new Promise((resolvePromise, reject) => {
    const proc = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["vite", "preview", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"],
      {
        cwd: resolve(import.meta.dirname, ".."),
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, VITE_SITE_URL: SITE_URL },
      },
    );

    let ready = false;

    const onData = (data) => {
      const text = data.toString();
      if (
        !ready &&
        (text.includes(BASE) ||
          text.includes(`localhost:${PORT}`) ||
          text.includes("Local:") ||
          text.includes("ready in"))
      ) {
        ready = true;
        resolvePromise(proc);
      }
    };

    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
    proc.on("error", reject);
    proc.on("exit", (code) => {
      if (!ready) reject(new Error(`vite preview exited with code ${code ?? "unknown"}`));
    });

    setTimeout(() => {
      if (!ready) reject(new Error("vite preview did not start within 60s"));
    }, 60_000);
  });
}

function outputPath(route) {
  if (route === "/") return resolve(DIST, "index.html");
  return resolve(DIST, route.slice(1), "index.html");
}

async function waitForBlogPostContent(page, route) {
  await page.waitForFunction(
    () => !document.body?.innerText?.includes("Загрузка статьи"),
    { timeout: 90_000 },
  );

  await page.waitForSelector('[data-blog-article-body][data-blog-body-ready="true"]', {
    timeout: 90_000,
  });

  const stats = await page.evaluate(() => {
    const article = document.querySelector("article");
    const body = document.querySelector("[data-blog-article-body][data-blog-body-ready='true']");
    const h2InBody = body ? body.querySelectorAll("h2").length : 0;
    const h2InArticle = article ? article.querySelectorAll("h2").length : 0;
    const bodyTextLen = body?.innerText?.trim().length ?? 0;
    const articleTextLen = article?.innerText?.trim().length ?? 0;
    return { h2InBody, h2InArticle, bodyTextLen, articleTextLen };
  });

  const h2 = Math.max(stats.h2InBody, stats.h2InArticle);
  if (h2 < MIN_BLOG_H2) {
    throw new Error(
      `[prerender] ${route}: только ${h2} h2 в body/article (нужно ≥${MIN_BLOG_H2}) — fetchBlogArticle/bodyHtml не успели`,
    );
  }
  if (stats.bodyTextLen < MIN_BLOG_BODY_CHARS) {
    throw new Error(
      `[prerender] ${route}: body ${stats.bodyTextLen} символов (нужно ≥${MIN_BLOG_BODY_CHARS})`,
    );
  }
  if (stats.articleTextLen < MIN_BLOG_ARTICLE_CHARS) {
    throw new Error(
      `[prerender] ${route}: article ${stats.articleTextLen} символов (нужно ≥${MIN_BLOG_ARTICLE_CHARS})`,
    );
  }

  console.log(
    `[prerender] ${route} body OK: h2=${stats.h2InBody}, body=${stats.bodyTextLen}, article=${stats.articleTextLen}`,
  );
}

async function waitForPageContent(page, route) {
  const expectedCanonical = canonicalForRoute(route);

  if (route === "/") {
    await page.waitForSelector("#session, [data-hero-section]", { timeout: 60_000 });
    await page.waitForSelector("h1", { timeout: 60_000 });
  } else if (isBlogPostRoute(route)) {
    await waitForBlogPostContent(page, route);
    await page.waitForSelector("article h1", { timeout: 60_000 });
  } else {
    await page.waitForSelector("h1", { timeout: 60_000 });
  }

  await page.waitForFunction(
    () => !document.body?.innerText?.includes("Загрузка..."),
    { timeout: 30_000 },
  );

  await page.waitForSelector('script[type="application/ld+json"]', { timeout: 30_000 }).catch(() => {});

  await page
    .waitForFunction(
      (canonicalUrl) => {
        const link = document.querySelector('link[rel="canonical"]');
        return link?.getAttribute("href") === canonicalUrl;
      },
      { timeout: 45_000 },
      expectedCanonical,
    )
    .catch(() => {
      console.warn(`[prerender] Canonical mismatch on ${route}, expected ${expectedCanonical}`);
    });

  await new Promise((r) => setTimeout(r, 300));
}

async function launchBrowser(puppeteer) {
  const launchOptions = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  };

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await puppeteer.launch(launchOptions);
    } catch (err) {
      lastError = err;
      console.warn(`[prerender] Browser launch attempt ${attempt}/3 failed`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw lastError;
}

async function prerender() {
  if (!existsSync(DIST)) {
    console.error("[prerender] dist/ not found. Run vite build first.");
    process.exit(1);
  }

  const { default: puppeteer } = await import("puppeteer");

  const routes = process.env.PRERENDER_ONLY
    ? process.env.PRERENDER_ONLY.split(",").map((route) => route.trim()).filter(Boolean)
    : SITE_ROUTES;

  console.log(`[prerender] Rendering ${routes.length} routes...`);
  const server = await startPreview();
  await new Promise((r) => setTimeout(r, 2000));

  const browser = await launchBrowser(puppeteer);
  const failures = [];

  try {
    for (const route of routes) {
      const url = `${BASE}${withTrailingSlash(route)}`;
      console.log(`[prerender] ${route}`);
      const page = await browser.newPage();
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
        await waitForPageContent(page, route);

        const html = await page.content();
        const out = outputPath(route);
        mkdirSync(dirname(out), { recursive: true });
        writeFileSync(out, html, "utf-8");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[prerender] FAILED ${route}: ${message}`);
        failures.push({ route, message });
        if (isBlogPostRoute(route)) {
          throw new Error(`Blog post prerender blocked: ${route} — ${message}`);
        }
      } finally {
        await page.close();
      }
    }

    await prerenderNotFoundPage(browser);

    await browser.close();
    server.kill("SIGTERM");
  } catch (err) {
    await browser?.close?.();
    server.kill("SIGTERM");
    throw err;
  }

  if (failures.length > 0) {
    console.error(`[prerender] ${failures.length} route(s) failed (non-blog)`);
    process.exit(1);
  }

  console.log("[prerender] Done.");
}

async function prerenderNotFoundPage(browser) {
  const url = `${BASE}${withTrailingSlash(NOT_FOUND_PRERENDER_PATH)}`;
  console.log(`[prerender] 404.html (via ${NOT_FOUND_PRERENDER_PATH})`);
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.waitForSelector("h1", { timeout: 60_000 });
    await page.waitForFunction(
      () => document.body?.innerText?.includes("Страница не найдена"),
      { timeout: 30_000 },
    );
    await new Promise((r) => setTimeout(r, 300));

    const html = await page.content();
    writeFileSync(resolve(DIST, "404.html"), html, "utf-8");
    console.log("[prerender] Wrote dist/404.html");
  } finally {
    await page.close();
  }
}

prerender().catch((err) => {
  console.error("[prerender] Failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
