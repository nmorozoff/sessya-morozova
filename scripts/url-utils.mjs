/** Canonical URL helpers — trailing slash on all paths except root semantics. */

export function normalizeSiteUrl(raw) {
  return (raw || "https://www.morozovanatalia.ru")
    .replace(/\/$/, "")
    .replace(/^http:\/\//i, "https://")
    .replace(/^https:\/\/morozovanatalia\.ru$/i, "https://www.morozovanatalia.ru");
}

/** @param {string} path e.g. "/panic-attacks" or "/blog/foo" */
export function withTrailingSlash(path) {
  if (!path || path === "/") return "/";
  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const queryIndex = withoutHash.indexOf("?");
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex) : "";
  const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const normalizedPath = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return `${normalizedPath}${query}${hash}`;
}

/** @param {string} siteUrl @param {string} route */
export function canonicalLoc(siteUrl, route) {
  const path = withTrailingSlash(route.startsWith("/") ? route : `/${route}`);
  return path === "/" ? `${siteUrl}/` : `${siteUrl}${path}`;
}
