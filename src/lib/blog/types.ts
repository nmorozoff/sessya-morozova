export type BlogPostMeta = {
  slug: string;
  topicId?: string | null;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  coverImage: string;
  excerpt: string;
};

export type BlogManifest = {
  generatedAt: string;
  postsPerPage: number;
  posts: BlogPostMeta[];
};

export type BlogArticleData = BlogPostMeta & {
  bodyHtml: string;
  schemaJsonLd?: Record<string, unknown>;
};

export type BlogBootstrapData =
  | { type: "article"; article: BlogArticleData }
  | { type: "index"; page: number };

export type PrerenderBlogState = {
  article?: BlogArticleData;
  indexPage?: number;
};

/** @deprecated Legacy JSON posts — use blog-manifest + fetchBlogArticle */
export type BlogPost = {
  slug: string;
  topicId: string;
  title: string;
  description: string;
  publishedAt: string;
  coverImage: string;
  coverAlt?: string;
  bodyHtml: string;
  wpCanonical?: string;
  tags?: string[];
};
