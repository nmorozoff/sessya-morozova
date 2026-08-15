import type { BlogArticleData, BlogPostMeta } from "./types";
import { SITE_URL } from "@/lib/site";

export function buildBlogPostingSchema(
  article: (BlogPostMeta | BlogArticleData) & { bodyHtml?: string },
  path: string,
) {
  const image = article.coverImage?.startsWith("http")
    ? article.coverImage
    : `${SITE_URL}${article.coverImage}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    image,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      "@type": "Person",
      name: "Наталья Морозова",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}${path}`,
    },
  };
}
