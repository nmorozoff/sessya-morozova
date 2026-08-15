import type { BlogArticleData, BlogBootstrapData } from "./types";
import { SITE_URL } from "@/lib/site";

function normalizeBlogSchema(raw: string, slug: string): unknown {
  const fixed = raw
    .replaceAll("__SITE_BASE__", SITE_URL)
    .replaceAll(`/wp-content/uploads/blog/${slug}`, `/blog-assets/${slug}`)
    .replaceAll("wp-content/uploads/blog/", "blog-assets/");
  const parsed = JSON.parse(fixed) as {
    "@graph"?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  const nodes = parsed["@graph"] || [parsed];
  for (const node of nodes) {
    if (node["@type"] !== "BlogPosting") continue;
    const publisher = node.publisher as Record<string, unknown> | undefined;
    if (publisher && !publisher.logo) {
      publisher.logo = {
        "@type": "ImageObject",
        url: `${SITE_URL}/favicon.png`,
        width: 192,
        height: 192,
      };
    }
  }
  return parsed;
}

export function readBlogBootstrap(): BlogBootstrapData | null {
  if (typeof document === "undefined") return null;

  const node = document.getElementById("__BLOG_BOOTSTRAP__");
  if (!node?.textContent) return null;

  try {
    return JSON.parse(node.textContent) as BlogBootstrapData;
  } catch {
    return null;
  }
}

const ASSET_VERSION = "?v=4";

export function blogAssetUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith("http") || path.includes("?")) return path;
  return `${path}${ASSET_VERSION}`;
}

export async function fetchBlogArticle(slug: string): Promise<BlogArticleData | null> {
  const [bodyRes, metaRes] = await Promise.all([
    fetch(`/blog-assets/${slug}/body.html`),
    fetch(`/blog-assets/${slug}/meta.json`),
  ]);

  if (!bodyRes.ok || !metaRes.ok) return null;

  const bodyHtml = await bodyRes.text();
  if (/^\s*<!doctype/i.test(bodyHtml) || /^\s*<html[\s>]/i.test(bodyHtml)) {
    console.warn(`[blog] Rejected SPA shell for ${slug}/body.html`);
    return null;
  }
  const meta = (await metaRes.json()) as Omit<BlogArticleData, "bodyHtml">;

  let schemaJsonLd: BlogArticleData["schemaJsonLd"];
  try {
    const schemaRes = await fetch(`/blog-assets/${slug}/schema.jsonld`);
    if (schemaRes.ok) {
      schemaJsonLd = normalizeBlogSchema(await schemaRes.text(), slug) as BlogArticleData["schemaJsonLd"];
    }
  } catch {
    schemaJsonLd = undefined;
  }

  return { ...meta, bodyHtml, schemaJsonLd };
}
