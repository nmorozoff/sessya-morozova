/**
 * @deprecated Используйте scripts/deploy-ftp-site.mjs (npm run deploy:site).
 * Оставлен как обёртка для старых вызовов deploy-ftp.mjs.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteScript = resolve(__dirname, "deploy-ftp-site.mjs");

console.warn("[deploy-ftp] Скрипт устарел → deploy-ftp-site.mjs (npm run deploy:site)");

const result = spawnSync(process.execPath, [siteScript, ...process.argv.slice(2)], {
  cwd: resolve(__dirname, ".."),
  stdio: "inherit",
});

process.exit(result.status ?? 1);
