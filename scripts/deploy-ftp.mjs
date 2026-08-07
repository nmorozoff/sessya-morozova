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

const OPTIONAL_REMOTE_FILES = new Set(["api/.htaccess"]);
const SKIP_REMOTE_PREFIXES = ["api/"];

function collectDeployFiles() {
  return collectFiles(DIST).filter((file) => {
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

async function uploadDist({ server, user, password, serverDir }) {
  if (!existsSync(DIST)) {
    throw new Error("Папка dist/ не найдена. Сначала выполните сборку.");
  }

  const files = collectDeployFiles();
  const remoteDir = (serverDir || "/public_html/").trim().replace(/\/+$/, "") || "/public_html";
  let lastError;

  for (const passive of [true, false]) {
    try {
      console.log(
        `[deploy] Загрузка ${files.length} файлов в ${remoteDir} (curl, passive=${passive}) ...`,
      );
      console.log("[deploy] Папка api/ не трогаем — config.php и форма остаются на сервере.");

      const createdDirs = new Set();

      for (const file of files) {
        const remoteDirPart = posix.dirname(file.remote);
        if (remoteDirPart !== ".") {
          const parts = remoteDirPart.split("/").filter(Boolean);
          for (let i = 1; i <= parts.length; i++) {
            const partial = parts.slice(0, i).join("/");
            if (!createdDirs.has(partial)) {
              await ensureRemoteDir({ server, user, password, remoteDir, subdir: partial, passive });
              createdDirs.add(partial);
            }
          }
        }

        process.stdout.write(`[deploy] ↑ ${file.remote}\n`);
        try {
          await curlUpload({
            server,
            user,
            password,
            remoteDir,
            local: file.local,
            remote: file.remote,
            passive,
          });
        } catch (err) {
          if (OPTIONAL_REMOTE_FILES.has(file.remote)) {
            console.warn(`[deploy] ⚠ пропущен ${file.remote}: ${err.message || err}`);
            continue;
          }
          throw new Error(`${file.remote}: ${err.message || err}`);
        }
      }

      return;
    } catch (err) {
      lastError = err;
      console.warn(`[deploy] Режим passive=${passive} не сработал: ${err.message || err}`);
    }
  }

  throw lastError ?? new Error("Не удалось загрузить файлы по FTP");
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
