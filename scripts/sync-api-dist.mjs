#!/usr/bin/env node
/** Копирует public/api/*.php в dist/api для локальной совместимости. */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(".");
const src = join(ROOT, "public/api");
const dest = join(ROOT, "dist/api");

if (!existsSync(src)) {
  console.error("Нет public/api");
  process.exit(1);
}

mkdirSync(dest, { recursive: true });

for (const name of readdirSync(src)) {
  if (!name.endsWith(".php")) continue;
  copyFileSync(join(src, name), join(dest, name));
}

console.log("[sync-api-dist] OK");
