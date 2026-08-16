import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { SITE_ROUTES } from "./routes.mjs";

const siteUrl = (process.env.VITE_SITE_URL || "https://www.morozovanatalia.ru")
  .replace(/\/$/, "")
  .replace(/^http:\/\//i, "https://")
  .replace(/^https:\/\/morozovanatalia\.ru$/i, "https://www.morozovanatalia.ru");
const lastmod = new Date().toISOString().slice(0, 10);

const urls = SITE_ROUTES.map(
  (route) => `  <url>
    <loc>${siteUrl}${route === "/" ? "/" : route}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${route === "/" ? "1.0" : "0.5"}</priority>
  </url>`,
).join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(resolve("public/sitemap.xml"), sitemap);

const robots = `User-agent: *
Allow: /
Disallow: /api/

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: YandexBot
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

writeFileSync(resolve("public/robots.txt"), robots);
