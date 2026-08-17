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

const ROOT = resolve(".");
const ENV_PATH = resolve(ROOT, ".ftp-deploy.env");
const DIST = resolve(ROOT, "dist");

const ALLOWED_API_REMOTE_FILES = [
  "api/send-form.php",
  "api/crm-webhook.php",
  "api/max-notify.php",
  "api/logs/.htaccess",
];
const OPTIONAL_API_REMOTE_FILES = ["api/.htaccess"];

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

function lftpQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function normalizeServer(server) {
  const trimmed = server.trim();
  if (trimmed.startsWith("ftp://") || trimmed.startsWith("ftps://")) {
    return trimmed;
  }
  return `ftp://${trimmed}`;
}

function normalizeRemoteDir(serverDir) {
  const dir = (serverDir || "/public_html/").trim().replace(/\/+$/, "");
  return dir || "/public_html";
}

function countDistFiles(dir) {
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
      lftpQuote(distPath),
      ".",
    ].join(" "),
    "mkdir -f api",
    "mkdir -f api/logs",
  ];

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
  const dir = mkdtempSync(join(tmpdir(), "deploy-lftp-"));
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
      if (code === 0 && stdout.trim()) {
        resolvePromise(stdout.trim());
      } else {
        reject(
          new Error(
            "lftp не найден. Установите: brew install lftp (macOS) или apt-get install -y lftp (Linux).",
          ),
        );
      }
    });
  });
}

function runLftpUpload({ server, user, password, serverDir }) {
  const remoteDir = normalizeRemoteDir(serverDir);
  const script = buildLftpScript({ server, user, password, remoteDir, distPath: DIST });
  const { dir, scriptPath } = writeSecureLftpBatch(script);
  const fileCount = countDistFiles(DIST);

  console.log(
    `[deploy] Загрузка dist/ → ${remoteDir} через lftp mirror -R (1 соединение, --parallel=1)`,
  );
  console.log(`[deploy] Файлов в dist/: ~${fileCount} (api/config.php на сервер не заливаем)`);
  console.log(
    "[deploy] api/: только send-form.php, crm-webhook.php, max-notify.php, logs/.htaccess",
  );
  console.log("[deploy] Запуск lftp...");

  return new Promise((resolvePromise, reject) => {
    const proc = spawn("lftp", ["-f", scriptPath], {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env },
    });

    const cleanup = () => {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // ignore temp cleanup errors
      }
    };

    proc.on("error", (err) => {
      cleanup();
      if (err.code === "ENOENT") {
        reject(
          new Error(
            "lftp не найден. Установите: brew install lftp (macOS) или apt-get install -y lftp (Linux).",
          ),
        );
        return;
      }
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
  const env = loadEnvFile(ENV_PATH);
  const siteUrl = requireEnv(env, "VITE_SITE_URL");
  const server = requireEnv(env, "FTP_SERVER");
  const user = requireEnv(env, "FTP_USERNAME");
  const password = requireEnv(env, "FTP_PASSWORD");
  const serverDir = env.FTP_SERVER_DIR?.trim() || "/public_html/";

  await ensureLftpAvailable();

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
      await runLftpUpload({ server, user, password, serverDir });
      console.log("[deploy] Готово. Проверьте сайт и sitemap.xml");
      return;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        console.warn(
          `[deploy] Попытка ${attempt}/${maxAttempts} не удалась, повтор через ${Math.round(OUTER_RETRY_DELAY_MS / 1000)} с...`,
        );
        await new Promise((r) => setTimeout(r, OUTER_RETRY_DELAY_MS));
      }
    }
  }

  throw lastError ?? new Error("Деплой не удался");
}

main().catch((err) => {
  console.error("[deploy] Ошибка:", err.message || err);
  process.exit(1);
});
