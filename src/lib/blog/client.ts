import type { BlogArticleData, BlogBootstrapData } from "./types";

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
    fetch(`/blog-assets/${slug}/body.html${ASSET_VERSION}`),
    fetch(`/blog-assets/${slug}/meta.json${ASSET_VERSION}`),
  ]);

  if (!bodyRes.ok || !metaRes.ok) return null;

  const bodyHtml = await bodyRes.text();
  const meta = (await metaRes.json()) as Omit<BlogArticleData, "bodyHtml">;

  let schemaJsonLd: BlogArticleData["schemaJsonLd"];
  try {
    const schemaRes = await fetch(`/blog-assets/${slug}/schema.jsonld${ASSET_VERSION}`);
    if (schemaRes.ok) {
      schemaJsonLd = JSON.parse(await schemaRes.text());
    }
  } catch {
    schemaJsonLd = undefined;
  }

  return { ...meta, bodyHtml, schemaJsonLd };
}
