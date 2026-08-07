import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadBlogManifest } from "./routes.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const CONTENT_DIR = resolve(ROOT, "content/blog");

/**
 * @param {string} slug
 * @returns {import('../src/lib/blog/types').BlogArticleData | null}
 */
export function loadArticleForPrerender(slug) {
  const manifest = loadBlogManifest();
  const post = manifest.posts.find((entry) => entry.slug === slug);
  if (!post) return null;

  const htmlPath = resolve(CONTENT_DIR, slug, "article.html");
  if (!existsSync(htmlPath)) return null;

  let bodyHtml = readFileSync(htmlPath, "utf8");
  // Rewrite relative cover/inline paths to absolute asset URLs for prerender.
  bodyHtml = bodyHtml.replace(
    new RegExp(`(src=["'])cover/`, "g"),
    `$1/blog-assets/${slug}/cover/`,
  );
  // Bust browser cache for freshly generated collage images.
  bodyHtml = bodyHtml.replace(
    new RegExp(`(/blog-assets/${slug}/cover/[^"'\\s]+)(\\?[^"'\\s]*)?`, "g"),
    (match, path, existingQuery) => (existingQuery ? match : `${path}?v=3`),
  );
  const schemaPath = resolve(CONTENT_DIR, slug, "schema.jsonld");
  let schemaJsonLd;

  if (existsSync(schemaPath)) {
    try {
      const parsed = JSON.parse(readFileSync(schemaPath, "utf8"));
      schemaJsonLd = parsed;
    } catch {
      schemaJsonLd = undefined;
    }
  }

  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    coverImage: post.coverImage,
    excerpt: post.excerpt,
    bodyHtml,
    schemaJsonLd,
  };
}

/**
 * @param {import('../src/lib/blog/types').BlogArticleData} article
 */
export function createArticleBootstrap(article) {
  return {
    type: "article",
    article,
  };
}

/**
 * @param {number} page
 */
export function createIndexBootstrap(page) {
  return {
    type: "index",
    page,
  };
}
