import { Link, useParams } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageMeta from "@/components/PageMeta";
import { getBlogPost } from "@/lib/blog/posts";
import NotFound from "./NotFound";

const BlogPost = () => {
  const { slug = "" } = useParams();
  const post = getBlogPost(slug);

  if (!post) return <NotFound />;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.coverImage.startsWith("http")
      ? post.coverImage
      : `https://www.morozovanatalia.ru${post.coverImage}`,
    datePublished: post.publishedAt,
    author: {
      "@type": "Person",
      name: "Наталья Морозова",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.morozovanatalia.ru/blog/${post.slug}/`,
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageMeta
        title={post.title}
        description={post.description}
        path={`/blog/${post.slug}`}
        ogImage={post.coverImage}
        jsonLd={jsonLd}
      />
      <Navbar />
      <main className="pt-28 pb-16 px-6 lg:px-[60px]">
        <article className="max-w-3xl mx-auto">
          <p className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground transition-colors">
              Главная
            </Link>
            <span className="mx-2">/</span>
            <Link to="/blog" className="hover:text-foreground transition-colors">
              Блог
            </Link>
          </p>
          <time className="text-xs text-muted-foreground">{post.publishedAt}</time>
          <h1 className="text-3xl md:text-4xl font-bold mt-3 mb-6 font-display">{post.title}</h1>
          <img
            src={post.coverImage}
            alt={post.coverAlt || post.title}
            className="w-full rounded-2xl mb-8 aspect-[16/9] object-cover"
          />
          <div
            className="prose prose-invert max-w-none prose-headings:font-display prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
          />
          {post.wpCanonical ? (
            <p className="mt-10 text-sm text-muted-foreground">
              Полная версия с иллюстрациями:{" "}
              <a href={post.wpCanonical} className="text-primary hover:underline">
                morozova-natalya.ru
              </a>
            </p>
          ) : null}
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
