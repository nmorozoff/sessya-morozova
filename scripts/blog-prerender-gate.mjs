/**
 * Post-prerender gate: every dist/blog/<slug>/index.html must contain real article body.
 * Fails the build if any published blog post is a thin shell (BT20-class incident).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DIST_BLOG = resolve(ROOT, "dist/blog");

const MIN_H2 = Number(process.env.BLOG_PRERENDER_MIN_H2 || process.env.PRERENDER_BLOG_MIN_H2 || 5);
const MIN_ARTICLE_CHARS = Number(
  process.env.BLOG_PRERENDER_MIN_CHARS || process.env.PRERENDER_BLOG_MIN_CHARS || 3000,
);
const MIN_BODY_CHARS = Number(process.env.BLOG_PRERENDER_MIN_BODY_CHARS || 2000);

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractArticleSection(html) {
  const match = html.match(/<article\b[\s\S]*?<\/article>/i);
  return match ? match[0] : "";
}

function extractBodySection(articleHtml) {
  const match = articleHtml.match(
    /<div[^>]*data-blog-article-body[^>]*data-blog-body-ready=["']true["'][^>]*>[\s\S]*?<\/div>/i,
  );
  if (match) return match[0];
  const fallback = articleHtml.match(/<div[^>]*data-blog-article-body[^>]*>[\s\S]*?<\/div>/i);
  return fallback ? fallback[0] : "";
}

function analyzePrerenderedArticle(slug, htmlPath) {
  const html = readFileSync(htmlPath, "utf8");
  const articleHtml = extractArticleSection(html);
  if (!articleHtml) {
    return { slug, ok: false, reason: "нет <article> в prerender HTML" };
  }

  const bodyHtml = extractBodySection(articleHtml);
  const bodyReady = /data-blog-body-ready=["']true["']/i.test(bodyHtml || articleHtml);
  const h2InArticle = (articleHtml.match(/<h2\b/gi) || []).length;
  const h2InBody = bodyHtml ? (bodyHtml.match(/<h2\b/gi) || []).length : 0;
  const articleTextLen = stripHtml(articleHtml).length;
  const bodyTextLen = bodyHtml ? stripHtml(bodyHtml).length : 0;

  const errors = [];
  if (!bodyReady) {
    errors.push("data-blog-body-ready отсутствует (bodyHtml не вставлен до snapshot)");
  }
  if (h2InBody < MIN_H2 && h2InArticle < MIN_H2) {
    errors.push(`h2=${h2InBody} в body / ${h2InArticle} в article (минимум ${MIN_H2})`);
  }
  if (bodyTextLen < MIN_BODY_CHARS) {
    errors.push(`текст body ${bodyTextLen} символов (минимум ${MIN_BODY_CHARS})`);
  }
  if (articleTextLen < MIN_ARTICLE_CHARS) {
    errors.push(`текст article ${articleTextLen} символов (минимум ${MIN_ARTICLE_CHARS})`);
  }

  return {
    slug,
    ok: errors.length === 0,
    reason: errors.join("; "),
    metrics: { h2InBody, h2InArticle, bodyTextLen, articleTextLen, bodyReady },
  };
}

function listArticleSlugs() {
  if (!existsSync(DIST_BLOG)) {
    return [];
  }
  const slugs = [];
  for (const entry of readdirSync(DIST_BLOG, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "page") continue;
    const indexPath = join(DIST_BLOG, entry.name, "index.html");
    if (existsSync(indexPath)) slugs.push(entry.name);
  }
  return slugs.sort();
}

function main() {
  const slugs = listArticleSlugs();
  if (slugs.length === 0) {
    console.error("[blog-prerender-gate] BLOCKER: dist/blog/<slug>/index.html не найдены — prerender не отработал");
    process.exit(1);
  }

  console.log(
    `[blog-prerender-gate] Проверка ${slugs.length} статей (min h2=${MIN_H2}, min article chars=${MIN_ARTICLE_CHARS})`,
  );

  const failures = [];
  for (const slug of slugs) {
    const result = analyzePrerenderedArticle(slug, join(DIST_BLOG, slug, "index.html"));
    if (result.ok) {
      console.log(
        `  ✓ ${slug}: h2=${result.metrics.h2InBody}, body=${result.metrics.bodyTextLen}, article=${result.metrics.articleTextLen}`,
      );
    } else {
      console.error(`  ✗ ${slug}: ${result.reason}`);
      failures.push(result);
    }
  }

  if (failures.length > 0) {
    console.error(
      `[blog-prerender-gate] BLOCKER: ${failures.length}/${slugs.length} статей не прошли gate`,
    );
    for (const f of failures) {
      console.error(`  - /blog/${f.slug}/: ${f.reason}`);
    }
    process.exit(1);
  }

  console.log(`[blog-prerender-gate] PASS (${slugs.length} статей)`);
}

main();
