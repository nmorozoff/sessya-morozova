import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/** Shared route list for sitemap generation and build-time prerender. */
export const STATIC_SITE_ROUTES = [
  "/",
  "/emdr-therapy",
  "/panic-attacks",
  "/phobias",
  "/anxiety",
  "/grief",
  "/divorce",
  "/sexual-abuse",
  "/emotional-abuse",
  "/eating-disorders",
  "/psychosomatics",
  "/business-psychology",
  "/ptsd",
  "/ocd",
  "/burnout",
  "/dissociation",
  "/complex-ptsd",
  "/parents-relationship",
  "/emigration-stress",
  "/privacy",
  "/privacy-policy",
  "/offer",
  "/advertising-consent",
];

function blogRoutes() {
  const manifestPath = resolve("content/blog/manifest.json");
  if (!existsSync(manifestPath)) return ["/blog"];
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const slugs = (manifest.posts || []).map((item) => `/blog/${item.slug}`);
    return ["/blog", ...slugs];
  } catch {
    return ["/blog"];
  }
}

export const SITE_ROUTES = [...STATIC_SITE_ROUTES, ...blogRoutes()];
