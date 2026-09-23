const rawSiteUrl = import.meta.env.VITE_SITE_URL ?? "https://www.morozovanatalia.ru";

/** Canonical host: always https://www.morozovanatalia.ru (no trailing slash). */
export const SITE_URL = rawSiteUrl
  .replace(/\/$/, "")
  .replace(/^http:\/\//i, "https://")
  .replace(/^https:\/\/morozovanatalia\.ru$/i, "https://www.morozovanatalia.ru");

/** Internal router path with trailing slash (except "/"). */
export function sitePath(path: string): string {
  if (!path || path === "/") return "/";
  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const queryIndex = withoutHash.indexOf("?");
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex) : "";
  const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const withSlash = normalized.endsWith("/") ? normalized : `${normalized}/`;
  return `${withSlash}${query}${hash}`;
}

/** Absolute canonical URL for meta/schema/sitemap. */
export function canonicalUrl(path: string): string {
  const p = sitePath(path);
  return p === "/" ? `${SITE_URL}/` : `${SITE_URL}${p}`;
}
