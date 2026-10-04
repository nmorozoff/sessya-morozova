import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

/**
 * Блокирует деплой, если content/blog/ не совпадает с последним коммитом.
 * SKIP_BLOG_GIT_CHECK=1 — только для отладки.
 */
export function assertContentBlogCommitted(logPrefix = "deploy") {
  if (process.env.SKIP_BLOG_GIT_CHECK === "1") {
    console.warn(`[${logPrefix}] SKIP_BLOG_GIT_CHECK=1 — проверка content/blog/ отключена`);
    return;
  }

  const result = spawnSync("git", ["status", "--porcelain", "--", "content/blog"], {
    cwd: ROOT,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    console.error(`[${logPrefix}] Не удалось выполнить git status для content/blog/`);
    process.exit(1);
  }

  const dirty = result.stdout.trim();
  if (!dirty) return;

  console.error(
    `[${logPrefix}] BLOCKER: в content/blog/ есть незакоммиченные изменения — сначала закоммить блог.`,
  );
  console.error("  git add content/blog && git commit -m \"...\" && git push origin main");
  console.error(dirty);
  process.exit(1);
}
