import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, posix, relative, resolve } from "node:path";
import { Client } from "basic-ftp";

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

async function connectClient(server, user, password) {
  const client = new Client(120_000);
  client.ftp.verbose = false;

  try {
    await client.access({ host: server, user, password, secure: false });
    return client;
  } catch {
    client.close();
    const secureClient = new Client(120_000);
    secureClient.ftp.verbose = false;
    await secureClient.access({ host: server, user, password, secure: true });
    return secureClient;
  }
}

async function cdToDeployRoot(client, serverDir) {
  const initialPwd = await client.pwd();
  console.log(`[deploy] FTP: подключено, текущая папка: ${initialPwd}`);

  const configured = (serverDir || "/public_html/").trim().replace(/\/+$/, "");
  const candidates = [
    configured,
    configured.replace(/^\//, ""),
    ".",
    "public_html",
    "/public_html",
  ].filter((value, index, arr) => value && arr.indexOf(value) === index);

  for (const candidate of candidates) {
    try {
      await client.cd(initialPwd);
      if (candidate === ".") {
        console.log(`[deploy] Используем текущую папку: ${await client.pwd()}`);
        return;
      }
      await client.cd(candidate);
      console.log(`[deploy] Перешли в: ${await client.pwd()}`);
      return;
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    `Не удалось открыть папку сайта. Проверьте FTP_SERVER_DIR в .ftp-deploy.env (сейчас: ${serverDir})`,
  );
}

const OPTIONAL_REMOTE_FILES = new Set(["api/.htaccess"]);
const SKIP_REMOTE_PREFIXES = ["api/"];

function collectDeployFiles() {
  return collectFiles(DIST).filter((file) => {
    return !SKIP_REMOTE_PREFIXES.some((prefix) => file.remote.startsWith(prefix));
  });
}

async function uploadDist({ server, user, password, serverDir }) {
  if (!existsSync(DIST)) {
    throw new Error("Папка dist/ не найдена. Сначала выполните сборку.");
  }

  const files = collectDeployFiles();
  const client = await connectClient(server, user, password);

  try {
    await cdToDeployRoot(client, serverDir);
    const deployRoot = await client.pwd();
    console.log(`[deploy] Загрузка ${files.length} файлов в ${deployRoot} ...`);
    console.log("[deploy] Папка api/ не трогаем — config.php и форма остаются на сервере.");

    for (const file of files) {
      await client.cd(deployRoot);
      const remoteDir = posix.dirname(file.remote);
      if (remoteDir !== ".") {
        await client.ensureDir(remoteDir);
        await client.cd(deployRoot);
      }
      process.stdout.write(`[deploy] ↑ ${file.remote}\n`);
      try {
        await client.uploadFrom(file.local, file.remote);
      } catch (err) {
        if (OPTIONAL_REMOTE_FILES.has(file.remote)) {
          console.warn(`[deploy] ⚠ пропущен ${file.remote}: ${err.message || err}`);
          continue;
        }
        throw new Error(`${file.remote}: ${err.message || err}`);
      }
    }
  } finally {
    client.close();
  }
}

async function main() {
  const env = loadEnvFile(ENV_PATH);
  const siteUrl = requireEnv(env, "VITE_SITE_URL");
  const server = requireEnv(env, "FTP_SERVER");
  const user = requireEnv(env, "FTP_USERNAME");
  const password = requireEnv(env, "FTP_PASSWORD");
  const serverDir = env.FTP_SERVER_DIR?.trim() || "/public_html/";

  if (process.env.SKIP_BUILD !== "1") {
    await runBuild(siteUrl);
  } else {
    console.log("[deploy] Пропуск сборки (SKIP_BUILD=1)");
  }
  await uploadDist({ server, user, password, serverDir });

  console.log("[deploy] Готово. Проверьте сайт и sitemap.xml");
}

main().catch((err) => {
  console.error("[deploy] Ошибка:", err.message || err);
  process.exit(1);
});
