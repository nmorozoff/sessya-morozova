import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { getBlogRoutes } from "./blog-routes.mjs";

/** Shared route list for sitemap generation and build-time prerender. */
export const STATIC_SITE_ROUTES = [
  "/",
  "/emdr-therapy",
  "/psychological-trauma",
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

const MANIFEST_PATH = resolve("src/generated/blog-manifest.json");

export function loadBlogManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    return { generatedAt: "", postsPerPage: 24, posts: [] };
  }

  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
}

function blogRoutes() {
  return getBlogRoutes(loadBlogManifest());
}

export const SITE_ROUTES = [...STATIC_SITE_ROUTES, ...blogRoutes()];
