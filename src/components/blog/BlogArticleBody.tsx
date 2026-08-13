type BlogArticleBodyProps = {
  html: string;
};

const BlogArticleBody = ({ html }: BlogArticleBodyProps) => (
  <div
    data-blog-article-body
    className="blog-article-body prose prose-neutral max-w-none prose-headings:font-display prose-a:text-primary prose-img:rounded-xl prose-img:border prose-img:border-border"
    dangerouslySetInnerHTML={{ __html: html }}
  />
);

export default BlogArticleBody;
