import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import puppeteer from "puppeteer";
import { SITE_ROUTES } from "./routes.mjs";

const DIST = resolve("dist");
const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;

function startPreview() {
  return new Promise((resolvePromise, reject) => {
    const proc = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["vite", "preview", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    let ready = false;

    const onData = (data) => {
      const text = data.toString();
      if (!ready && (text.includes("Local:") || text.includes(BASE))) {
        ready = true;
        resolvePromise(proc);
      }
    };

    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
    proc.on("error", reject);

    setTimeout(() => {
      if (!ready) reject(new Error("Preview server did not start within 60s"));
    }, 60_000);
  });
}

function outputPath(route) {
  if (route === "/") return resolve(DIST, "index.html");
  return resolve(DIST, route.slice(1), "index.html");
}

async function waitForPageContent(page) {
  await page.waitForSelector("h1", { timeout: 30_000 });
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
      () => {
        const canonical = document.querySelector('link[rel="canonical"]');
        return canonical && !canonical.getAttribute("href")?.includes("your-domain");
      },
      { timeout: 30_000 },
    )
    .catch(() => {});
}

async function prerender() {
  if (!existsSync(DIST)) {
    console.error("[prerender] dist/ not found. Run vite build first.");
    process.exit(1);
  }

  console.log(`[prerender] Rendering ${SITE_ROUTES.length} routes...`);
  const server = await startPreview();

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    for (const route of SITE_ROUTES) {
      const url = `${BASE}${route}`;
      console.log(`[prerender] ${route}`);
      await page.goto(url, { waitUntil: "networkidle0", timeout: 60_000 });
      await waitForPageContent(page);

      const html = await page.content();
      const out = outputPath(route);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, html, "utf-8");
    }
  } finally {
    await browser.close();
    server.kill("SIGTERM");
  }

  console.log("[prerender] Done.");
}

prerender().catch((err) => {
  console.error("[prerender] Failed:", err);
  process.exit(1);
});
