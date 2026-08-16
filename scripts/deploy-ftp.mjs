import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, posix, relative, resolve } from "node:path";

const ROOT = resolve(".");
const ENV_PATH = resolve(ROOT, ".ftp-deploy.env");
const DIST = resolve(ROOT, "dist");

function loadEnvFile(path) {
  if (!existsSync(path)) {
    console.error(`[deploy] Не найден ${basename(path)}`);
    console.error(`[deploy] Скопируйте .ftp-deploy.env.example → .ftp-deploy.env и заполните поля.`);
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
    console.error(`[deploy] В .ftp-deploy.env не заполнено: ${key}`);
    process.exit(1);
  }
  return value;
}

function runBuild(siteUrl) {
  return new Promise((resolvePromise, reject) => {
    console.log("[deploy] Сборка проекта...");
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

function collectFiles(dir, base = dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectFiles(full, base));
    } else {
      files.push({
        local: full,
        remote: posix.join(relative(base, full).split("\\").join("/")),
      });
    }
  }
  return files;
}

const SKIP_REMOTE_FILES = new Set([".DS_Store"]);
const OPTIONAL_REMOTE_FILES = new Set(["api/.htaccess", "api/logs/.htaccess"]);
const ALLOWED_API_REMOTE_FILES = new Set([
  "api/send-form.php",
  "api/crm-webhook.php",
  "api/max-notify.php",
  "api/logs/.htaccess",
]);
const SKIP_REMOTE_PREFIXES = ["api/"];

function collectDeployFiles() {
  return collectFiles(DIST).filter((file) => {
    if (SKIP_REMOTE_FILES.has(basename(file.local))) return false;
    if (ALLOWED_API_REMOTE_FILES.has(file.remote)) return true;
    return !SKIP_REMOTE_PREFIXES.some((prefix) => file.remote.startsWith(prefix));
  });
}

function ftpUrl(server, remoteDir, remotePath) {
  const dir = remoteDir.replace(/\/+$/, "");
  const path = remotePath.startsWith("/") ? remotePath.slice(1) : remotePath;
  return `ftp://${server}${dir}/${path}`;
}

function curlUpload({ server, user, password, remoteDir, local, remote, passive }) {
  const url = ftpUrl(server, remoteDir, remote);
  const args = [
    "--silent",
    "--show-error",
    "--fail",
    "--connect-timeout",
    "30",
    "--retry",
    "2",
    "--retry-delay",
    "2",
    "-u",
    `${user}:${password}`,
    "-T",
    local,
  ];

  if (passive) {
    args.push("--ftp-pasv");
  } else {
    args.push("--ftp-port", "-");
  }

  args.push(url);

  return new Promise((resolvePromise, reject) => {
    const proc = spawn("curl", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", reject);
    proc.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(stderr.trim() || `curl exit ${code}`));
    });
  });
}

async function ensureRemoteDir({ server, user, password, remoteDir, subdir, passive }) {
  if (!subdir || subdir === ".") return;

  const parts = subdir.split("/").filter(Boolean);
  let current = "";

  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    const url = `${ftpUrl(server, remoteDir, current)}/`;
    const args = [
      "--silent",
      "--show-error",
      "--connect-timeout",
      "30",
      "-u",
      `${user}:${password}`,
    ];

    if (passive) args.push("--ftp-pasv");
    args.push("--ftp-create-dirs", url);

    await new Promise((resolvePromise, reject) => {
      const proc = spawn("curl", args, { stdio: ["ignore", "pipe", "pipe"] });
      let stderr = "";
      proc.stderr?.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      proc.on("error", reject);
      proc.on("exit", (code) => {
        // Timeweb: 9 = directory exists or CWD ok — не фейлим MKD
        if (code === 0 || code === 9) resolvePromise();
        else reject(new Error(stderr.trim() || `mkdir ${current} exit ${code}`));
      });
    });
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadFileWithRetry(params, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await curlUpload({ ...params, passive: true });
      return;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await sleep(1000 * attempt);
      }
    }
  }
  throw lastError ?? new Error("upload failed");
}

async function uploadDist({ server, user, password, serverDir }) {
  if (!existsSync(DIST)) {
    throw new Error("Папка dist/ не найдена. Сначала выполните сборку.");
  }

  const files = collectDeployFiles();
  const remoteDir = (serverDir || "/public_html/").trim().replace(/\/+$/, "") || "/public_html";
  const createdDirs = new Set();
  const failed = [];

  console.log(
    `[deploy] Загрузка ${files.length} файлов в ${remoteDir} (curl passive, retry per file) ...`,
  );
  console.log(
    "[deploy] api/: загружаем send-form.php и logs/.htaccess — config.php на сервере не трогаем.",
  );

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const remoteDirPart = posix.dirname(file.remote);
    if (remoteDirPart !== ".") {
      const parts = remoteDirPart.split("/").filter(Boolean);
      for (let j = 1; j <= parts.length; j++) {
        const partial = parts.slice(0, j).join("/");
        if (!createdDirs.has(partial)) {
          await ensureRemoteDir({
            server,
            user,
            password,
            remoteDir,
            subdir: partial,
            passive: true,
          });
          createdDirs.add(partial);
        }
      }
    }

    process.stdout.write(`[deploy] [${i + 1}/${files.length}] ↑ ${file.remote}\n`);
    try {
      await uploadFileWithRetry({
        server,
        user,
        password,
        remoteDir,
        local: file.local,
        remote: file.remote,
      });
    } catch (err) {
      if (OPTIONAL_REMOTE_FILES.has(file.remote)) {
        console.warn(`[deploy] ⚠ пропущен ${file.remote}: ${err.message || err}`);
        continue;
      }
      failed.push({ remote: file.remote, error: err.message || String(err) });
      console.warn(`[deploy] ✗ ${file.remote}: ${err.message || err}`);
    }

    // Не забивать Timeweb частыми LOGIN — пауза между файлами
    if (i < files.length - 1) {
      await sleep(80);
    }
  }

  if (failed.length > 0) {
    throw new Error(
      `Не загружено файлов: ${failed.length}. Первый: ${failed[0].remote} — ${failed[0].error}`,
    );
  }
}

const skipBuildRequested =
  process.env.SKIP_BUILD === "1" || process.argv.includes("--skip-build");

async function main() {
  const env = loadEnvFile(ENV_PATH);
  const siteUrl = requireEnv(env, "VITE_SITE_URL");
  const server = requireEnv(env, "FTP_SERVER");
  const user = requireEnv(env, "FTP_USERNAME");
  const password = requireEnv(env, "FTP_PASSWORD");
  const serverDir = env.FTP_SERVER_DIR?.trim() || "/public_html/";

  if (skipBuildRequested) {
    if (!existsSync(DIST)) {
      console.error("[deploy] dist/ не найден. Сначала выполните: npm run build");
      process.exit(1);
    }
    console.log("[deploy] Пропуск сборки (--skip-build / SKIP_BUILD=1)");
  } else {
    await runBuild(siteUrl);
  }

  const maxAttempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await uploadDist({ server, user, password, serverDir });
      console.log("[deploy] Готово. Проверьте сайт и sitemap.xml");
      return;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        console.warn(`[deploy] Попытка ${attempt}/${maxAttempts} не удалась, повтор через 3 с...`);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  throw lastError ?? new Error("Деплой не удался");
}

main().catch((err) => {
  console.error("[deploy] Ошибка:", err.message || err);
  process.exit(1);
});
