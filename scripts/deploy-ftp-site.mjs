/**
 * Site-only FTP deploy: React shell, assets/, legal pages, images/, llms.txt, api/*.
 * НЕ заливает blog/** и blog-assets/** (для блога: scripts/deploy-ftp-blog.mjs).
 */
import { spawn } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { assertContentBlogCommitted } from "./assert-content-blog-committed.mjs";
import { submitIndexNowFromSitemap } from "./indexnow.mjs";

const ROOT = resolve(".");
const ENV_PATH = resolve(ROOT, ".ftp-deploy.env");
const DIST = resolve(ROOT, "dist");

const ALLOWED_API_REMOTE_FILES = [
  "api/send-form.php",
  "api/morozova-amocrm.php",
  "api/morozova-traffic-source.php",
  "api/morozova-visitor-geo.php",
  "api/crm-webhook.php",
  "api/max-notify.php",
  "api/logs/.htaccess",
];
const OPTIONAL_API_REMOTE_FILES = ["api/.htaccess"];

const LOG = "deploy-site";

function loadEnvFile(path) {
  if (!existsSync(path)) {
    console.error(`[${LOG}] Не найден ${basename(path)}`);
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
    console.error(`[${LOG}] В .ftp-deploy.env не заполнено: ${key}`);
    process.exit(1);
  }
  return value;
}

function runBuild(siteUrl) {
  return new Promise((resolvePromise, reject) => {
    console.log(`[${LOG}] Сборка проекта...`);
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

function buildLftpScript({ server, user, password, remoteDir, distPath }) {
  const commands = [
    "set cmd:fail-exit true",
    "set cmd:verbose true",
    "set ftp:ssl-allow no",
    "set ftp:passive-mode true",
    "set net:max-retries 3",
    "set net:reconnect-interval-base 5",
    "set net:reconnect-interval-multiplier 1",
    `open -u ${lftpQuote(`${user},${password}`)} ${lftpQuote(normalizeServer(server))}`,
    `cd ${lftpQuote(remoteDir)}`,
    [
      "mirror -R",
      "--parallel=1",
      "--verbose",
      "--exclude-glob .DS_Store",
      "--exclude-glob api/*",
      "--exclude-glob blog/**",
      "--exclude-glob blog-assets/**",
      lftpQuote(distPath),
      ".",
    ].join(" "),
    "mkdir -f api",
    "mkdir -f api/logs",
  ];

  commands.push(`put ${lftpQuote(resolve(DIST, "index.html"))} -o home-shell.html`);
  commands.push(`put ${lftpQuote(resolve(DIST, "index.php"))} -o index.php`);
  commands.push(`put ${lftpQuote(resolve(DIST, "404.html"))} -o 404.html`);
  commands.push(`put ${lftpQuote(resolve(DIST, ".htaccess"))} -o .htaccess`);
  commands.push("set cmd:fail-exit false");
  commands.push("rm index.html");
  commands.push("set cmd:fail-exit true");

  for (const remote of ALLOWED_API_REMOTE_FILES) {
    const local = resolve(DIST, ...remote.split("/"));
    commands.push(`put ${lftpQuote(local)} -o ${remote}`);
  }

  for (const remote of OPTIONAL_API_REMOTE_FILES) {
    const local = resolve(DIST, ...remote.split("/"));
    commands.push("set cmd:fail-exit false");
    commands.push(`put ${lftpQuote(local)} -o ${remote}`);
    commands.push("set cmd:fail-exit true");
  }

  commands.push("bye");
  return `${commands.join("; ")}\n`;
}

function writeSecureLftpBatch(script) {
  const dir = mkdtempSync(join(tmpdir(), "deploy-site-lftp-"));
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

function runLftpUpload({ server, user, password, serverDir }) {
  const remoteDir = normalizeRemoteDir(serverDir);
  const script = buildLftpScript({ server, user, password, remoteDir, distPath: DIST });
  const { dir, scriptPath } = writeSecureLftpBatch(script);

  console.log(`[${LOG}] Загрузка dist/ → ${remoteDir} (без blog/** и blog-assets/**)`);
  console.log(`[${LOG}] api/: send-form.php, morozova-amocrm.php, …`);
  console.log(`[${LOG}] Запуск lftp...`);

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

const skipBuildRequested =
  process.env.SKIP_BUILD === "1" || process.argv.includes("--skip-build");

const OUTER_RETRY_DELAY_MS = Number(process.env.DEPLOY_OUTER_RETRY_DELAY_MS || 120_000);

async function main() {
  assertContentBlogCommitted(LOG);

  const env = loadEnvFile(ENV_PATH);
  const siteUrl = requireEnv(env, "VITE_SITE_URL");
  const server = requireEnv(env, "FTP_SERVER");
  const user = requireEnv(env, "FTP_USERNAME");
  const password = requireEnv(env, "FTP_PASSWORD");
  const serverDir = env.FTP_SERVER_DIR?.trim() || "/public_html/";

  await ensureLftpAvailable();

  if (skipBuildRequested) {
    if (!existsSync(DIST)) {
      console.error(`[${LOG}] dist/ не найден. Сначала: npm run build`);
      process.exit(1);
    }
    console.log(`[${LOG}] Пропуск сборки (--skip-build)`);
  } else {
    await runBuild(siteUrl);
  }

  const maxAttempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await runLftpUpload({ server, user, password, serverDir });
      console.log(`[${LOG}] Готово (site-only). blog/** и blog-assets/** на сервере не менялись.`);
      return;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        console.warn(
          `[${LOG}] Попытка ${attempt}/${maxAttempts} не удалась, повтор через ${Math.round(OUTER_RETRY_DELAY_MS / 1000)} с...`,
        );
        await new Promise((r) => setTimeout(r, OUTER_RETRY_DELAY_MS));
      }
    }
  }

  throw lastError ?? new Error("site deploy failed");
}

main().catch((err) => {
  console.error(`[${LOG}] Ошибка:`, err.message || err);
  process.exit(1);
});
