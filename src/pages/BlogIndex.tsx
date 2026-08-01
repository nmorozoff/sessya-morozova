import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageMeta from "@/components/PageMeta";
import { getAllBlogPosts } from "@/lib/blog/posts";

const BlogIndex = () => {
  const posts = getAllBlogPosts();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageMeta
        title="Блог психолога Натальи Морозовой — EMDR, тревога, травма"
        description="Статьи о EMDR-терапии, тревоге, фобиях, горе и психологической поддержке. Москва и онлайн."
        path="/blog"
      />
      <Navbar />
      <main className="pt-28 pb-16 px-6 lg:px-[60px]">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 font-display">Блог</h1>
          <p className="text-muted-foreground mb-10 max-w-2xl">
            Материалы о тревоге, травме, горе и EMDR — бережно и по делу.
          </p>
          {posts.length === 0 ? (
            <p className="text-muted-foreground">Скоро появятся новые статьи.</p>
          ) : (
            <div className="grid gap-6">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="bg-bg3 border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors"
                >
                  <Link to={`/blog/${post.slug}`} className="block md:grid md:grid-cols-[220px_1fr]">
                    <img
                      src={post.coverImage}
                      alt={post.coverAlt || post.title}
                      loading="lazy"
                      className="w-full h-48 md:h-full object-cover"
                    />
                    <div className="p-6">
                      <time className="text-xs text-muted-foreground">{post.publishedAt}</time>
                      <h2 className="text-xl font-bold mt-2 mb-3 hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">{post.description}</p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogIndex;
