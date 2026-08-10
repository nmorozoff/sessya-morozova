import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import BlogArticleBody from "@/components/blog/BlogArticleBody";
import BlogLayout, { BlogBackLink } from "@/components/blog/BlogLayout";
import { fetchBlogArticle, readBlogBootstrap, blogAssetUrl } from "@/lib/blog/client";
import { usePrerenderBlog } from "@/lib/blog/context";
import { findBlogPost, formatBlogDate } from "@/lib/blog/manifest";
import { buildBlogPostingSchema } from "@/lib/blog/schema";
import type { BlogArticleData } from "@/lib/blog/types";

const BlogPost = () => {
  const { slug = "" } = useParams();
  const prerender = usePrerenderBlog();
  const bootstrap = useMemo(() => readBlogBootstrap(), []);
  const manifestPost = findBlogPost(slug);
  const [article, setArticle] = useState<BlogArticleData | null>(() => {
    if (prerender.article?.slug === slug) return prerender.article;
    if (bootstrap?.type === "article" && bootstrap.article.slug === slug) return bootstrap.article;
    return null;
  });
  const [loading, setLoading] = useState(!article && Boolean(slug));

  useEffect(() => {
    if (article?.slug === slug || !slug) return;

    let cancelled = false;
    setLoading(true);

    fetchBlogArticle(slug)
      .then((data) => {
        if (!cancelled) setArticle(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [article?.slug, slug]);

  const path = `/blog/${slug}`;
  const title = article?.title || manifestPost?.title || "Статья";
  const description = article?.description || manifestPost?.description || "";
  const pageTitle = `${title} | Наталья Морозова`;
  const schema = article
    ? article.schemaJsonLd || buildBlogPostingSchema(article, path)
    : manifestPost
      ? buildBlogPostingSchema({ ...manifestPost, bodyHtml: "" }, path)
      : undefined;

  if (!manifestPost && !loading && !article) {
    return (
      <BlogLayout>
        <PageMeta
          title="Статья не найдена | Наталья Морозова"
          description="Запрошенная статья не найдена."
          path={path}
        />
        <div className="max-w-3xl mx-auto">
          <BlogBackLink />
          <h1 className="text-3xl font-bold mb-4">Статья не найдена</h1>
          <p className="text-muted-foreground mb-6">Возможно, материал был перемещён или ещё не опубликован.</p>
          <Link to="/blog" className="text-primary font-semibold hover:text-accent transition-colors">
            Перейти в блог →
          </Link>
        </div>
      </BlogLayout>
    );
  }

  return (
    <BlogLayout>
      <PageMeta
        title={pageTitle}
        description={description}
        path={path}
        ogImage={article?.coverImage || manifestPost?.coverImage}
        jsonLd={schema}
      />
      <article className="max-w-3xl mx-auto">
        <BlogBackLink />

        {loading && !article ? (
          <p className="text-muted-foreground text-sm">Загрузка статьи...</p>
        ) : (
          <>
            {article?.coverImage ? (
              <img
                src={blogAssetUrl(article.coverImage)}
                alt={`Иллюстрация к статье: ${title}`}
                className="w-full max-h-[420px] object-cover rounded-[20px] border border-border mb-8"
              />
            ) : null}

            <header className="mb-8">
              <time className="text-xs text-muted-foreground" dateTime={article?.publishedAt || manifestPost?.publishedAt}>
                {formatBlogDate(article?.publishedAt || manifestPost?.publishedAt || "")}
              </time>
              <h1 className="text-3xl sm:text-4xl font-black mt-3 mb-4">{title}</h1>
              {description ? (
                <p className="text-muted-foreground text-[15px] leading-relaxed">{description}</p>
              ) : null}
            </header>

            {article?.bodyHtml ? <BlogArticleBody html={article.bodyHtml} /> : null}

            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-muted-foreground text-[15px] mb-4">
                Если тема откликается, можно обсудить её на бесплатной 30-минутной консультации.
              </p>
              <Link
                to="/#session"
                className="inline-flex bg-primary text-primary-foreground px-6 py-3 rounded-[10px] text-sm font-bold hover:bg-accent transition-colors"
              >
                Записаться на консультацию →
              </Link>
            </div>
          </>
        )}
      </article>
    </BlogLayout>
  );
};

export default BlogPost;
