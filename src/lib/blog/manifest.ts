import blogManifest from "@/generated/blog-manifest.json";
import type { BlogManifest, BlogPostMeta } from "./types";

export const BLOG_MANIFEST = blogManifest as BlogManifest;
export const BLOG_POSTS_PER_PAGE = BLOG_MANIFEST.postsPerPage;

export function getTotalBlogPages(postCount = BLOG_MANIFEST.posts.length): number {
  return Math.max(1, Math.ceil(postCount / BLOG_POSTS_PER_PAGE));
}

export function getBlogPostsForPage(page: number, posts: BlogPostMeta[] = BLOG_MANIFEST.posts): BlogPostMeta[] {
  const safePage = Math.min(Math.max(page, 1), getTotalBlogPages(posts.length));
  const start = (safePage - 1) * BLOG_POSTS_PER_PAGE;
  return posts.slice(start, start + BLOG_POSTS_PER_PAGE);
}

export function blogIndexPath(page: number): string {
  return page <= 1 ? "/blog" : `/blog/page/${page}`;
}

export function formatBlogDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function findBlogPost(slug: string): BlogPostMeta | undefined {
  return BLOG_MANIFEST.posts.find((post) => post.slug === slug);
}
