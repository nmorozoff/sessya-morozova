/**
 * Blog-only FTP deploy for Excalibur (sessya-morozova).
 *
 * Uploads ONLY blog-related artifacts from dist/:
 *   - blog/**           (prerendered /blog/ listing + article pages)
 *   - blog-assets/**    (optionally scoped to --slug)
 *   - sitemap.xml
 *
 * NEVER touches: api/, index.html, assets/, or any other site root files.
 * Full site deploy: npm run deploy / scripts/deploy-ftp.mjs (manual only).
 */
import { spawn } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";
import { tmpdir } from "node:os";

const ROOT = resolve(".");
const ENV_PATH = resolve(ROOT, ".ftp-deploy.env");
const DIST = resolve(ROOT, "dist");

const FORBIDDEN_REMOTE_PREFIXES = [
  "api/",
  "index.html",
  "index.php",
  "home-shell.html",
  "404.html",
  ".htaccess",
];

function parseArgs(argv) {
  const out = { skipBuild: false, slug: "" };
  for (const arg of argv) {
    if (arg === "--skip-build") out.skipBuild = true;
    else if (arg.startsWith("--slug=")) out.slug = arg.slice("--slug=".length).trim();
    else if (arg === "--slug" && argv[argv.indexOf(arg) + 1]) {
      out.slug = argv[argv.indexOf(arg) + 1].trim();
    }
  }
  if (process.env.SKIP_BUILD === "1") out.skipBuild = true;
  if (process.env.EXCALIBUR_BLOG_DEPLOY_SLUG?.trim()) {
    out.slug = process.env.EXCALIBUR_BLOG_DEPLOY_SLUG.trim();
  }
  return out;
}

function loadEnvFile(path) {
  if (!existsSync(path)) {
    console.error(`[deploy-blog] Не найден ${basename(path)}`);
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function requireEnv(env, key) {
  const value = env[key]?.trim();
  if (!value) {
    console.error(`[deploy-blog] В .ftp-deploy.env не заполнено: ${key}`);
    process.exit(1);
  }
  return value;
}

function lftpQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function normalizeServer(server) {
  const trimmed = server.trim();
  if (trimmed.startsWith("ftp://") || trimmed.startsWith("ftps://")) return trimmed;
  return `ftp://${trimmed}`;
}

function normalizeRemoteDir(serverDir) {
  const dir = (serverDir || "/public_html/").trim().replace(/\/+$/, "");
  return dir || "/public_html";
}

function countFiles(dir) {
  if (!existsSync(dir)) return 0;
  let count = 0;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = resolve(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name !== ".DS_Store") count += 1;
    }
  }
  return count;
}

function assertBlogArtifacts(slug) {
  const blogDir = resolve(DIST, "blog");
  if (!existsSync(blogDir)) {
    console.error("[deploy-blog] BLOCKER: dist/blog/ не найден — нужен npm run build с prerender");
    process.exit(1);
  }
  const blogIndex = resolve(blogDir, "index.html");
  if (!existsSync(blogIndex) || statSync(blogIndex).size < 5000) {
    console.error(
      "[deploy-blog] BLOCKER: dist/blog/index.html отсутствует или слишком мал — prerender обязателен",
    );
    process.exit(1);
  }
  if (slug) {
    const articleHtml = resolve(blogDir, slug, "index.html");
    if (!existsSync(articleHtml)) {
      console.error(`[deploy-blog] BLOCKER: нет dist/blog/${slug}/index.html после prerender`);
      process.exit(1);
    }
    if (statSync(articleHtml).size < 5000) {
      console.error(
        `[deploy-blog] BLOCKER: dist/blog/${slug}/index.html слишком мал — prerender не отработал`,
      );
      process.exit(1);
    }
  }
  const sitemap = resolve(DIST, "sitemap.xml");
  if (!existsSync(sitemap)) {
    console.error("[deploy-blog] BLOCKER: dist/sitemap.xml не найден");
    process.exit(1);
  }
}

function buildLftpScript({ server, user, password, remoteDir, slug }) {
  const commands = [
    "set cmd:fail-exit true",
    "set cmd:verbose true",
    "set ftp:ssl-allow no",
    "set ftp:passive-mode true",
    "set net:max-retries 3",
    "set net:reconnect-interval-base 5",
    `open -u ${lftpQuote(`${user},${password}`)} ${lftpQuote(normalizeServer(server))}`,
    `cd ${lftpQuote(remoteDir)}`,
    [
      "mirror -R",
      "--parallel=1",
      "--verbose",
      "--exclude-glob .DS_Store",
      lftpQuote(resolve(DIST, "blog")),
      "blog",
    ].join(" "),
  ];

  const assetsLocal = slug
    ? resolve(DIST, "blog-assets", slug)
    : resolve(DIST, "blog-assets");
  if (existsSync(assetsLocal)) {
    const assetsRemote = slug ? `blog-assets/${slug}` : "blog-assets";
    if (slug) {
      commands.push(`mkdir -f blog-assets`);
    }
    commands.push(
      [
        "mirror -R",
        "--parallel=1",
        "--verbose",
        "--exclude-glob .DS_Store",
        lftpQuote(assetsLocal),
        assetsRemote,
      ].join(" "),
    );
  } else if (slug) {
    console.warn(`[deploy-blog] WARN: dist/blog-assets/${slug} не найден — пропуск assets`);
  }

  commands.push(`put ${lftpQuote(resolve(DIST, "sitemap.xml"))} -o sitemap.xml`);
  commands.push("bye");
  return `${commands.join("; ")}\n`;
}

function writeSecureLftpBatch(script) {
  const dir = mkdtempSync(join(tmpdir(), "deploy-blog-lftp-"));
  chmodSync(dir, 0o700);
  const scriptPath = join(dir, "upload.lftp");
  writeFileSync(scriptPath, script, { mode: 0o600 });
  return { dir, scriptPath };
}

async function ensureLftpAvailable() {
  return new Promise((resolvePromise, reject) => {
    const proc = spawn("which", ["lftp"], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("exit", (code) => {
      if (code === 0 && stdout.trim()) resolvePromise(stdout.trim());
      else reject(new Error("lftp не найден (brew install lftp)"));
    });
  });
}

function runBuild(siteUrl) {
  return new Promise((resolvePromise, reject) => {
    console.log("[deploy-blog] Сборка с prerender (npm run build)...");
    const proc = spawn("npm", ["run", "build"], {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, VITE_SITE_URL: siteUrl },
    });
    proc.on("error", reject);
    proc.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`npm run build завершился с кодом ${code}`));
    });
  });
}

function runLftpUpload({ server, user, password, serverDir, slug }) {
  const remoteDir = normalizeRemoteDir(serverDir);
  const script = buildLftpScript({ server, user, password, remoteDir, slug });
  for (const forbidden of FORBIDDEN_REMOTE_PREFIXES) {
    if (script.includes(` ${forbidden}`) || script.includes(`/${forbidden}`)) {
      throw new Error(`internal guard: script would touch forbidden path ${forbidden}`);
    }
  }
  const { dir, scriptPath } = writeSecureLftpBatch(script);
  const blogFiles = countFiles(resolve(DIST, "blog"));
  const assetRoot = slug ? resolve(DIST, "blog-assets", slug) : resolve(DIST, "blog-assets");
  const assetFiles = countFiles(assetRoot);

  console.log(`[deploy-blog] Whitelist upload → ${remoteDir}`);
  console.log(`[deploy-blog]   blog/** (~${blogFiles} files)`);
  console.log(
    `[deploy-blog]   blog-assets${slug ? `/${slug}` : ""}/ (~${assetFiles} files)`,
  );
  console.log("[deploy-blog]   sitemap.xml");
  console.log(
    "[deploy-blog] ЗАПРЕЩЕНО: api/, index.html, index.php, home-shell.html, .htaccess, assets/",
  );

  return new Promise((resolvePromise, reject) => {
    const proc = spawn("lftp", ["-f", scriptPath], { cwd: ROOT, stdio: "inherit" });
    const cleanup = () => {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    };
    proc.on("error", (err) => {
      cleanup();
      reject(err);
    });
    proc.on("exit", (code) => {
      cleanup();
      if (code === 0) resolvePromise();
      else reject(new Error(`lftp завершился с кодом ${code}`));
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = loadEnvFile(ENV_PATH);
  const siteUrl = requireEnv(env, "VITE_SITE_URL");
  const server = requireEnv(env, "FTP_SERVER");
  const user = requireEnv(env, "FTP_USERNAME");
  const password = requireEnv(env, "FTP_PASSWORD");
  const serverDir = env.FTP_SERVER_DIR?.trim() || "/public_html/";

  await ensureLftpAvailable();

  if (args.skipBuild) {
    if (!existsSync(DIST)) {
      console.error("[deploy-blog] dist/ не найден. Сначала npm run build");
      process.exit(1);
    }
    console.log("[deploy-blog] Пропуск сборки (--skip-build)");
  } else {
    await runBuild(siteUrl);
  }

  assertBlogArtifacts(args.slug);

  const maxAttempts = 3;
  const delayMs = Number(process.env.DEPLOY_OUTER_RETRY_DELAY_MS || 120_000);
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await runLftpUpload({ server, user, password, serverDir, slug: args.slug });
      console.log("[deploy-blog] Готово (blog-only). api/ и index.html не затронуты.");
      return;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        console.warn(
          `[deploy-blog] Попытка ${attempt}/${maxAttempts} не удалась, повтор через ${Math.round(delayMs / 1000)} с...`,
        );
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastError ?? new Error("blog-only deploy failed");
}

main().catch((err) => {
  console.error("[deploy-blog] Ошибка:", err.message || err);
  process.exit(1);
});
