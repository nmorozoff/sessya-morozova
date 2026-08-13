import type { BlogArticleData, BlogPostMeta } from "./types";

const SITE = "https://www.morozovanatalia.ru";

export function buildBlogPostingSchema(
  article: (BlogPostMeta | BlogArticleData) & { bodyHtml?: string },
  path: string,
) {
  const image = article.coverImage?.startsWith("http")
    ? article.coverImage
    : `${SITE}${article.coverImage}`;

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
      "@id": `${SITE}${path}`,
    },
  };
}
