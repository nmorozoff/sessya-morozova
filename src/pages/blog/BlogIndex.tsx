import { Link, useParams } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import BlogLayout from "@/components/blog/BlogLayout";
import BlogPagination from "@/components/blog/BlogPagination";
import {
  BLOG_MANIFEST,
  blogIndexPath,
  formatBlogDate,
  getBlogPostsForPage,
  getTotalBlogPages,
} from "@/lib/blog/manifest";
import { blogAssetUrl } from "@/lib/blog/client";

const BlogIndex = () => {
  const { pageNum } = useParams();
  const requestedPage = pageNum ? Number.parseInt(pageNum, 10) : 1;
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const totalPages = getTotalBlogPages();
  const safePage = Math.min(currentPage, totalPages);
  const posts = getBlogPostsForPage(safePage);
  const path = blogIndexPath(safePage);

  const title =
    safePage === 1
      ? "Блог | Наталья Морозова"
      : `Блог — страница ${safePage} | Наталья Морозова`;

  const description =
    "Статьи о психологии, EMDR-терапии, тревоге, травме и восстановлении. Практические материалы от психолога Натальи Морозовой.";

  return (
    <BlogLayout>
      <PageMeta title={title} description={description} path={path} />
      <div className="max-w-5xl mx-auto">
        <p className="text-primary text-sm font-semibold tracking-wide uppercase mb-3">Блог</p>
        <h1 className="text-3xl sm:text-4xl font-black mb-4">Статьи и материалы</h1>
        <p className="text-muted-foreground text-[15px] leading-relaxed max-w-2xl mb-10">
          Разборы запросов, с которыми я работаю на консультациях: тревога, травма, отношения, выгорание и
          психотерапевтические методы.
        </p>

        {posts.length === 0 ? (
          <div className="bg-bg3 border border-border rounded-[20px] p-8 text-muted-foreground text-[15px]">
            Пока нет опубликованных статей. Новые материалы появятся здесь в ближайшее время.
          </div>
        ) : (
          <div className="grid gap-5">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="bg-bg3 border border-border rounded-[20px] p-6 sm:p-8 hover:border-primary/30 transition-colors"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {post.coverImage ? (
                    <Link to={`/blog/${post.slug}`} className="shrink-0">
                      <img
                        src={blogAssetUrl(post.coverImage)}
                        alt={`Обложка статьи: ${post.title}`}
                        className="w-full lg:w-48 h-40 object-cover rounded-xl border border-border"
                        loading="lazy"
                      />
                    </Link>
                  ) : null}
                  <div className="min-w-0">
                    <time className="text-xs text-muted-foreground" dateTime={post.publishedAt}>
                      {formatBlogDate(post.publishedAt)}
                    </time>
                    <h2 className="text-xl sm:text-2xl font-bold mt-2 mb-3">
                      <Link to={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                        {post.title}
                      </Link>
                    </h2>
                    <p className="text-muted-foreground text-[15px] leading-relaxed mb-4">{post.excerpt}</p>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="text-sm font-semibold text-primary hover:text-accent transition-colors"
                    >
                      Читать статью →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <BlogPagination currentPage={safePage} />

        {BLOG_MANIFEST.posts.length > 0 ? (
          <p className="text-center text-xs text-muted-foreground mt-6">
            Всего статей: {BLOG_MANIFEST.posts.length}
          </p>
        ) : null}
      </div>
    </BlogLayout>
  );
};

export default BlogIndex;
