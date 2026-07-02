import { useLayoutEffect } from "react";
import { SITE_URL } from "@/lib/site";

export type PageSeo = {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

const PageMeta = ({ title, description, path, ogImage = "/og-image.jpg", jsonLd }: PageSeo) => {
  const canonical = `${SITE_URL}${path === "/" ? "/" : path}`;
  const image = ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  useLayoutEffect(() => {
    document.title = title;
    upsertLink("canonical", canonical);
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:locale", "ru_RU");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);
  }, [title, description, canonical, image]);

  return (
    <>
      {schemas.map((data, index) => (
        <script
          key={`page-jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
    </>
  );
};

export default PageMeta;
