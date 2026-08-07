/** Blog route helpers — shared by sitemap, prerender, and publish tooling. */

export const BLOG_POSTS_PER_PAGE = 24;

/**
 * @param {{ posts: unknown[] }} manifest
 * @returns {string[]}
 */
export function getBlogRoutes(manifest) {
  const postCount = manifest.posts?.length ?? 0;
  const routes = ["/blog"];

  if (postCount === 0) {
    return routes;
  }

  const totalPages = Math.ceil(postCount / BLOG_POSTS_PER_PAGE);
  for (let page = 2; page <= totalPages; page += 1) {
    routes.push(`/blog/page/${page}`);
  }

  for (const post of manifest.posts) {
    routes.push(`/blog/${post.slug}`);
  }

  return routes;
}

/**
 * @param {string[]} siteRoutes
 * @param {{ posts: unknown[] }} manifest
 * @returns {string[]}
 */
export function getAllSiteRoutes(siteRoutes, manifest) {
  return [...siteRoutes, ...getBlogRoutes(manifest)];
}

/**
 * @param {string} route
 * @returns {{ kind: "index"; page: number } | { kind: "post"; slug: string } | null}
 */
export function parseBlogRoute(route) {
  if (route === "/blog") {
    return { kind: "index", page: 1 };
  }

  const pageMatch = route.match(/^\/blog\/page\/(\d+)$/);
  if (pageMatch) {
    const page = Number.parseInt(pageMatch[1], 10);
    if (page >= 2) {
      return { kind: "index", page };
    }
    return null;
  }

  const postMatch = route.match(/^\/blog\/([^/]+)$/);
  if (postMatch && postMatch[1] !== "page") {
    return { kind: "post", slug: postMatch[1] };
  }

  return null;
}
