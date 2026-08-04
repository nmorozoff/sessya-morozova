import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { BLOG_POSTS_PER_PAGE } from "./blog-routes.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const CONTENT_DIR = resolve(ROOT, "content/blog");
const MANIFEST_PATH = resolve(ROOT, "src/generated/blog-manifest.json");
const PUBLIC_ASSETS_DIR = resolve(ROOT, "public/blog-assets");

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerptFromHtml(html, maxLength = 160) {
  const text = stripHtml(html);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function normalizeMeta(raw, slugFromDir) {
  const slug = raw.slug || slugFromDir;
  const title =
    raw.title ||
    raw.meta_ab?.title_seo ||
    raw.meta_ab?.title_aeo ||
    raw.h1 ||
    slug;
  const description =
    raw.description ||
    raw.meta_ab?.description_seo ||
    raw.meta_ab?.description_aeo ||
    "";
  const publishedAt =
    raw.publishedAt ||
    raw.published_at ||
    raw.date ||
    new Date().toISOString().slice(0, 10);

  return {
    slug,
    topicId: raw.topic_id || raw.topicId || null,
    title,
    description,
    publishedAt,
    updatedAt: raw.updatedAt || raw.updated_at || publishedAt,
    coverImage: raw.coverImage || raw.cover_image || `/blog-assets/${slug}/cover.png`,
  };
}

function loadPosts() {
  if (!existsSync(CONTENT_DIR)) {
    mkdirSync(CONTENT_DIR, { recursive: true });
    return [];
  }

  const posts = [];

  for (const entry of readdirSync(CONTENT_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

    const articleDir = resolve(CONTENT_DIR, entry.name);
    const metaPath = resolve(articleDir, "article.meta.json");
    const htmlPath = resolve(articleDir, "article.html");

    if (!existsSync(metaPath) || !existsSync(htmlPath)) {
      console.warn(`[blog-manifest] Skip ${entry.name}: missing article.meta.json or article.html`);
      continue;
    }

    const rawMeta = JSON.parse(readFileSync(metaPath, "utf8"));
    const bodyHtml = readFileSync(htmlPath, "utf8");
    const meta = normalizeMeta(rawMeta, entry.name);

    if (!meta.description) {
      meta.description = excerptFromHtml(bodyHtml, 160);
    }

    meta.excerpt = excerptFromHtml(bodyHtml, 200);
    posts.push({ ...meta, contentDir: articleDir });
  }

  posts.sort((a, b) => {
    const dateDiff = b.publishedAt.localeCompare(a.publishedAt);
    if (dateDiff !== 0) return dateDiff;
    return a.slug.localeCompare(b.slug);
  });

  return posts;
}

function syncPublicAssets(posts) {
  rmSync(PUBLIC_ASSETS_DIR, { recursive: true, force: true });
  mkdirSync(PUBLIC_ASSETS_DIR, { recursive: true });

  for (const post of posts) {
    const slug = post.slug;
    const targetDir = resolve(PUBLIC_ASSETS_DIR, slug);
    mkdirSync(targetDir, { recursive: true });

    const htmlPath = resolve(post.contentDir, "article.html");
    const metaPath = resolve(post.contentDir, "article.meta.json");
    const schemaPath = resolve(post.contentDir, "schema.jsonld");
    const coverDir = resolve(post.contentDir, "cover");

    writeFileSync(resolve(targetDir, "body.html"), readFileSync(htmlPath, "utf8"), "utf8");

    const publicMeta = { ...post };
    delete publicMeta.contentDir;
    writeFileSync(resolve(targetDir, "meta.json"), `${JSON.stringify(publicMeta, null, 2)}\n`, "utf8");

    if (existsSync(schemaPath)) {
      writeFileSync(resolve(targetDir, "schema.jsonld"), readFileSync(schemaPath, "utf8"), "utf8");
    }

    if (existsSync(coverDir)) {
      const targetCoverDir = resolve(targetDir, "cover");
      mkdirSync(targetCoverDir, { recursive: true });
      for (const entry of readdirSync(coverDir, { withFileTypes: true })) {
        const src = resolve(coverDir, entry.name);
        const dst = resolve(targetCoverDir, entry.name);
        if (entry.isFile()) {
          cpSync(src, dst);
        } else if (entry.isDirectory()) {
          cpSync(src, dst, { recursive: true });
        }
      }
      // Keep the canonical cover at the asset root for the manifest coverImage path.
      const rootCover = resolve(coverDir, "cover.png");
      if (existsSync(rootCover)) {
        cpSync(rootCover, resolve(targetDir, "cover.png"));
      }
    }
  }
}

function writeManifest(posts) {
  const manifestPosts = posts.map(({ contentDir: _contentDir, ...post }) => post);
  const manifest = {
    generatedAt: new Date().toISOString(),
    postsPerPage: BLOG_POSTS_PER_PAGE,
    posts: manifestPosts,
  };

  mkdirSync(resolve(ROOT, "src/generated"), { recursive: true });
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

function main() {
  const posts = loadPosts();
  syncPublicAssets(posts);
  const manifest = writeManifest(posts);

  console.log(
    `[blog-manifest] ${manifest.posts.length} post(s), ${Math.max(1, Math.ceil(manifest.posts.length / BLOG_POSTS_PER_PAGE))} index page(s)`,
  );
}

main();
