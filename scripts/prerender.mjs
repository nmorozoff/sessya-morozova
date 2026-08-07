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

  console.log(`[prerender] Rendering ${SITE_ROUTES.length} routes...`);
  const server = await startPreview();
  await new Promise((r) => setTimeout(r, 2000));

  const browser = await launchBrowser(puppeteer);

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
  console.warn("[prerender] Continuing with Vite SPA build (.htaccess fallback).");
  process.exit(0);
});
