import type { BlogManifest, BlogPost } from "./types";

const postModules = import.meta.glob("../../../content/blog/posts/*.json", {
  eager: true,
  import: "default",
}) as Record<string, BlogPost>;

const manifestModule = import.meta.glob("../../../content/blog/manifest.json", {
  eager: true,
  import: "default",
}) as Record<string, BlogManifest>;

function loadManifest(): BlogManifest {
  const first = Object.values(manifestModule)[0];
  return first ?? { posts: [] };
}

export function getAllBlogPosts(): BlogPost[] {
  const bySlug = new Map<string, BlogPost>();
  for (const post of Object.values(postModules)) {
    if (post?.slug) bySlug.set(post.slug, post);
  }
  const manifest = loadManifest();
  const ordered = manifest.posts
    .map((item) => bySlug.get(item.slug))
    .filter((post): post is BlogPost => Boolean(post));
  for (const post of bySlug.values()) {
    if (!ordered.some((item) => item.slug === post.slug)) ordered.push(post);
  }
  return ordered.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return getAllBlogPosts().find((post) => post.slug === slug);
}
