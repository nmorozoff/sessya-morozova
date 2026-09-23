#!/usr/bin/env node
/**
 * Точечный деплой amoCRM API + патч config.php на сервере (без mirror dist/).
 * Секреты: CRM/amocrm.secrets.env (путь через AMO_SECRETS_ENV).
 */
import { spawn } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";
import { tmpdir } from "node:os";

const ROOT = resolve(".");
const ENV_PATH = resolve(ROOT, ".ftp-deploy.env");
const DEFAULT_SECRETS = resolve(
  ROOT,
  "../CRM и Онлайн запись психолога/amocrm.secrets.env",
);

function loadEnvFile(path) {
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

function runLftp(script) {
  const dir = mkdtempSync(join(tmpdir(), "amo-lftp-"));
  chmodSync(dir, 0o700);
  const scriptPath = join(dir, "run.lftp");
  writeFileSync(scriptPath, script, { mode: 0o600 });
  return new Promise((resolvePromise, reject) => {
    const proc = spawn("lftp", ["-f", scriptPath], { stdio: "inherit" });
    proc.on("error", reject);
    proc.on("exit", (code) => {
      rmSync(dir, { recursive: true, force: true });
      if (code === 0) resolvePromise();
      else reject(new Error(`lftp exit ${code}`));
    });
  });
}

/** Примитивный парсер return [ 'k' => 'v', ... ] для плоских строковых ключей. */
function parsePhpFlatStrings(content) {
  const out = {};
  const re = /'([a-z0-9_]+)'\s*=>\s*'((?:\\'|[^'])*)'/gi;
  for (const m of content.matchAll(re)) {
    out[m[1]] = m[2].replace(/\\'/g, "'");
  }
  return out;
}

function phpExport(value, indent = 0) {
  const pad = "    ".repeat(indent);
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    const isList = Array.isArray(value);
    const lines = [];
    for (const [k, v] of entries) {
      const key = isList ? "" : `${phpExport(String(k))} => `;
      lines.push(`${pad}    ${key}${phpExport(v, indent + 1)},`);
    }
    return `[\n${lines.join("\n")}\n${pad}]`;
  }
  throw new Error("unsupported type");
}

function buildConfigPhp(config) {
  const body = phpExport(config, 0);
  return `<?php
/**
 * Серверный конфиг — не в git.
 */
return ${body};
`;
}

function patchConfigContent(original, secrets) {
  const flat = parsePhpFlatStrings(original);
  const config = {
    db_host: flat.db_host || "localhost",
    db_port: flat.db_port || "3306",
    db_name: flat.db_name || "",
    db_user: flat.db_user || "",
    db_pass: flat.db_pass || "",
    site_domain: flat.site_domain || "morozovanatalia.ru",
    internal_api_secret: secrets.INTERNAL_API_SECRET,
    amocrm: {
      enabled: true,
      subdomain: secrets.AMO_SUBDOMAIN,
      access_token: secrets.AMO_ACCESS_TOKEN,
      pipeline_id: Number(secrets.AMO_PIPELINE_ID),
      status_id: Number(secrets.AMO_STATUS_ID),
      format_field_id: Number(secrets.AMO_FORMAT_FIELD_ID || 0),
      request_field_id: Number(secrets.AMO_REQUEST_FIELD_ID || 0),
      messenger_field_id: Number(secrets.AMO_MESSENGER_FIELD_ID || 0),
      telegram_field_id: Number(secrets.AMO_TELEGRAM_FIELD_ID || 0),
      traffic_source_field_id: Number(secrets.AMO_TRAFFIC_SOURCE_FIELD_ID || 0),
      utm_code_field_id: Number(secrets.AMO_UTM_CODE_FIELD_ID || 0),
      utm_campaign_field_id: Number(secrets.AMO_UTM_CAMPAIGN_FIELD_ID || 0),
      utm_medium_field_id: Number(secrets.AMO_UTM_MEDIUM_FIELD_ID || 0),
      traffic_account_field_id: Number(secrets.AMO_TRAFFIC_ACCOUNT_FIELD_ID || 0),
    },
    crm_webhook_url: "",
    crm_webhook_secret: "",
  };

  if (flat.telegram_bot_token) {
    config.telegram_bot_token = flat.telegram_bot_token;
  }
  if (flat.telegram_chat_id) {
    config.telegram_chat_id = flat.telegram_chat_id;
  }

  return buildConfigPhp(config);
}

async function main() {
  const ftpEnv = loadEnvFile(ENV_PATH);
  const secretsPath = process.env.AMO_SECRETS_ENV || DEFAULT_SECRETS;
  if (!existsSync(secretsPath)) {
    throw new Error(`Не найден secrets: ${secretsPath}`);
  }
  const secrets = loadEnvFile(secretsPath);

  const server = ftpEnv.FTP_SERVER;
  const user = ftpEnv.FTP_USERNAME;
  const password = ftpEnv.FTP_PASSWORD;
  const remoteDir = normalizeRemoteDir(ftpEnv.FTP_SERVER_DIR);

  const workDir = mkdtempSync(join(tmpdir(), "amo-deploy-"));
  const remoteConfig = join(workDir, "config.php");
  const patchedConfig = join(workDir, "config.patched.php");

  const puts = [
    ["dist/api/send-form.php", "api/send-form.php"],
    ["dist/api/morozova-amocrm.php", "api/morozova-amocrm.php"],
    ["dist/api/backfill-amocrm-utm.php", "api/backfill-amocrm-utm.php"],
    ["dist/api/max-notify.php", "api/max-notify.php"],
    ["public/amocrm/callback.php", "amocrm/callback.php"],
    ["public/amocrm/callback/index.php", "amocrm/callback/index.php"],
    ["public/amocrm/.htaccess", "amocrm/.htaccess"],
    ["public/.htaccess", ".htaccess"],
  ];

  for (const [local] of puts) {
    if (!existsSync(resolve(ROOT, local))) {
      throw new Error(`Нет файла: ${local}`);
    }
  }

  const open = `open -u ${lftpQuote(`${user},${password}`)} ${lftpQuote(normalizeServer(server))}`;
  const cd = `cd ${lftpQuote(remoteDir)}`;

  console.log("[amo-deploy] Скачиваю api/config.php с сервера...");
  await runLftp(
    [
      "set cmd:fail-exit true",
      "set ftp:ssl-allow no",
      "set ftp:passive-mode true",
      open,
      cd,
      `get api/config.php -o ${lftpQuote(remoteConfig)}`,
      "bye",
    ].join("; ") + "\n",
  );

  const original = readFileSync(remoteConfig, "utf8");
  const patched = patchConfigContent(original, secrets);
  writeFileSync(patchedConfig, patched, { mode: 0o600 });

  const putCmds = puts
    .map(
      ([local, remote]) =>
        `put ${lftpQuote(resolve(ROOT, local))} -o ${remote}`,
    )
    .join("; ");

  console.log("[amo-deploy] Загружаю PHP + обновлённый config.php...");
  await runLftp(
    [
      "set cmd:fail-exit true",
      "set ftp:ssl-allow no",
      "set ftp:passive-mode true",
      open,
      cd,
      "mkdir -f api",
      "mkdir -f amocrm/callback",
      putCmds,
      `put ${lftpQuote(patchedConfig)} -o api/config.php`,
      "bye",
    ].join("; ") + "\n",
  );

  rmSync(workDir, { recursive: true, force: true });
  console.log("[amo-deploy] Готово (config.php обновлён на сервере).");
}

main().catch((err) => {
  console.error("[amo-deploy] Ошибка:", err.message || err);
  process.exit(1);
});
