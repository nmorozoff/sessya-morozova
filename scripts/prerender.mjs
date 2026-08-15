import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { SITE_ROUTES } from "./routes.mjs";

if (process.env.SKIP_PRERENDER === "1" || process.env.EXCALIBUR_REACT_SKIP_PRERENDER === "yes") {
  console.log("[prerender] SKIP_PRERENDER — пропуск (vite dist без puppeteer)");
  process.exit(0);
}

const DIST = resolve("dist");
const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;
const SITE_URL = (process.env.VITE_SITE_URL || "https://www.morozovanatalia.ru")
  .replace(/\/$/, "")
  .replace(/^http:\/\//i, "https://")
  .replace(/^https:\/\/morozovanatalia\.ru$/i, "https://www.morozovanatalia.ru");

function canonicalForRoute(route) {
  return route === "/" ? `${SITE_URL}/` : `${SITE_URL}${route}`;
}

function startPreview() {
  return new Promise((resolvePromise, reject) => {
    const proc = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["serve", DIST, "-s", "-l", String(PORT), "--no-clipboard"],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    let ready = false;

    const onData = (data) => {
      const text = data.toString();
      if (!ready && (text.includes("Accepting connections") || text.includes(BASE))) {
        ready = true;
        resolvePromise(proc);
      }
    };

    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
    proc.on("error", reject);
    proc.on("exit", (code) => {
      if (!ready) reject(new Error(`Preview server exited with code ${code ?? "unknown"}`));
    });

    setTimeout(() => {
      if (!ready) reject(new Error("Preview server did not start within 60s"));
    }, 60_000);
  });
}

function outputPath(route) {
  if (route === "/") return resolve(DIST, "index.html");
  return resolve(DIST, route.slice(1), "index.html");
}

async function waitForPageContent(page, route) {
  const expectedCanonical = canonicalForRoute(route);

  const isBlogPost =
    route.startsWith("/blog/") && route !== "/blog" && !route.startsWith("/blog/page/");

  if (route === "/") {
    await page.waitForSelector("#session, [data-hero-section]", { timeout: 60_000 }).catch(() => {});
    await page.waitForSelector("h1", { timeout: 60_000 });
  } else if (isBlogPost) {
    await page
      .waitForSelector("[data-blog-article-body]", { timeout: 90_000 })
      .catch(() => {});
    await page
      .waitForFunction(
        () => {
          const el = document.querySelector("[data-blog-article-body]");
          return el && (el.textContent?.trim().length ?? 0) > 200;
        },
        { timeout: 90_000 },
      )
      .catch(() => {});
    await page.waitForSelector("article h1", { timeout: 60_000 }).catch(() => {});
  } else {
    await page.waitForSelector("h1", { timeout: 60_000 });
  }

  await page
    .waitForFunction(
      () => !document.body?.innerText?.includes("Загрузка..."),
      { timeout: 30_000 },
    )
    .catch(() => {});

  await page
    .waitForSelector('script[type="application/ld+json"]', { timeout: 30_000 })
    .catch(() => {});

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

  await new Promise((r) => setTimeout(r, 500));
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

  try {
    for (const route of routes) {
      const url = `${BASE}${route}`;
      console.log(`[prerender] ${route}`);
      const page = await browser.newPage();
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
        await waitForPageContent(page, route);

        const html = await page.content();
        const out = outputPath(route);
        mkdirSync(dirname(out), { recursive: true });
        writeFileSync(out, html, "utf-8");
      } catch (err) {
        console.warn(`[prerender] Failed ${route}:`, err instanceof Error ? err.message : err);
      } finally {
        await page.close();
      }
    }

    await browser.close();
    server.kill("SIGTERM");
  } catch (err) {
    await browser?.close?.();
    server.kill("SIGTERM");
    throw err;
  }

  console.log("[prerender] Done.");
}

prerender().catch((err) => {
  console.error("[prerender] Failed:", err);
  console.warn("[prerender] Continuing with Vite SPA build (.htaccess fallback).");
  process.exit(0);
});
