#!/usr/bin/env node
/**
 * Preflight перед deploy:api — php -l и проверка require/include.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "..");
const API_DIR = join(ROOT, "public/api");

function resolvePhpBinary() {
  const candidates = [
    process.env.PHP_BIN,
    "php",
    "/opt/homebrew/bin/php",
    "/usr/local/bin/php",
  ].filter(Boolean);
  for (const bin of candidates) {
    const r = spawnSync(bin, ["-v"], { encoding: "utf8" });
    if (r.status === 0) {
      return bin;
    }
  }
  return null;
}

const SKIP_DEPLOY = new Set([
  "config.php",
  "max.config.php",
]);

const REQUIRE_RE =
  /\b(?:require|include)(?:_once)?\s*(?:\(\s*)?(?:__DIR__\s*\.\s*['"]([^'"]+)['"]|['"]([^'"]+)['"])/gi;

function fail(msg) {
  console.error(`[api-preflight] FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`[api-preflight] OK: ${msg}`);
}

if (!existsSync(API_DIR)) {
  fail("нет каталога public/api");
}

const phpFiles = readdirSync(API_DIR).filter((f) => f.endsWith(".php"));
if (phpFiles.length === 0) {
  fail("нет PHP-файлов в public/api");
}

const phpBin = resolvePhpBinary();
if (!phpBin) {
  fail(
    "не найден PHP CLI (brew install php или задайте PHP_BIN). Без php -l deploy:api не запускается.",
  );
}

let lintErrors = 0;
for (const file of phpFiles) {
  const path = join(API_DIR, file);
  const r = spawnSync(phpBin, ["-l", path], { encoding: "utf8" });
  if (r.status !== 0) {
    console.error(r.stdout || r.stderr || `lint failed: ${file}`);
    lintErrors++;
  }
}
if (lintErrors > 0) {
  fail(`php -l: ${lintErrors} файл(ов) с ошибками`);
}
ok(`php -l (${phpBin}): ${phpFiles.length} файлов`);

const missingDeps = [];
for (const file of phpFiles) {
  const content = readFileSync(join(API_DIR, file), "utf8");
  for (const m of content.matchAll(REQUIRE_RE)) {
    const rel = m[1] || m[2];
    if (!rel || !rel.endsWith(".php")) {
      continue;
    }
    const target = resolve(API_DIR, rel);
    if (!existsSync(target)) {
      missingDeps.push({ from: file, target: rel });
    }
  }
}

if (missingDeps.length > 0) {
  for (const d of missingDeps) {
    console.error(`  ${d.from} → ${d.target} (нет файла)`);
  }
  fail("не найдены зависимости require/include");
}
ok("все require/include указывают на файлы в public/api");

export function listApiDeployFiles() {
  const files = readdirSync(API_DIR)
    .filter((f) => f.endsWith(".php") && !SKIP_DEPLOY.has(f))
    .sort();
  const extras = ["data/.htaccess", "logs/.htaccess", ".htaccess"];
  for (const extra of extras) {
    const p = join(API_DIR, extra);
    if (existsSync(p)) {
      files.push(extra);
    }
  }
  return files.map((f) => ({
    local: join("public/api", f),
    remote: `api/${f}`,
  }));
}

if (process.argv[1]?.endsWith("api-preflight.mjs")) {
  ok("preflight пройден");
}
