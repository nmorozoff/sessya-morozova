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

export type BlogManifest = {
  posts: Array<{
    slug: string;
    publishedAt: string;
    title: string;
  }>;
};
