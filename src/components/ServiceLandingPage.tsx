import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import {
  buildBreadcrumbSchema,
  buildFaqPageSchema,
  webPageSchema,
} from "@/lib/schema";
import { type ServicePageConfig } from "@/lib/services/types";
import { Link } from "react-router-dom";
import { type SectionParagraphLink } from "@/lib/services/types";

type ServiceLandingPageProps = ServicePageConfig;

function renderParagraphWithLink(text: string, link?: Pick<SectionParagraphLink, "match" | "to">) {
  if (!link) return text;

  const regex =
    typeof link.match === "string"
      ? new RegExp(link.match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      : link.match;
  const match = text.match(regex);
  if (!match || match.index === undefined) return text;

  const matched = match[0];
  const start = match.index;

  return (
    <>
      {text.slice(0, start)}
      <Link to={link.to} className="text-primary underline-offset-2 hover:underline">
        {matched}
      </Link>
      {text.slice(start + matched.length)}
    </>
  );
}

const ServiceLandingPage = ({
  slug,
  breadcrumb,
  title,
  description,
  h1,
  geoBlock,
  intro,
  sections,
  table,
  faq,
}: ServiceLandingPageProps) => {
  const path = `/${slug}`;
  const pageSchema = webPageSchema(h1, description, path);
  const faqSchema = buildFaqPageSchema(faq);
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumb, path);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageMeta
        title={title}
        description={description}
        path={path}
        jsonLd={[pageSchema, faqSchema, breadcrumbSchema]}
      />
      <Navbar />
      <main className="pt-28 pb-16 px-6 lg:px-[60px]">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:text-foreground transition-colors">
              Главная
            </Link>
            <span className="mx-2">/</span>
            <span>{breadcrumb}</span>
          </p>

          <h1 className="text-3xl md:text-4xl font-bold mb-6">{h1}</h1>

          <p className="geo-direct-answer text-lg leading-relaxed mb-5 text-foreground/90">{geoBlock}</p>

          <p className="leading-relaxed mb-8 text-muted-foreground">{intro}</p>

          {sections.map((section) => (
            <section key={section.h2} className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">{section.h2}</h2>
              {section.paragraphs?.map((paragraph, paragraphIndex) => {
                const linkConfig = section.paragraphLinks?.find(
                  (item) => !item.trailing && item.paragraphIndex === paragraphIndex,
                );
                return (
                  <p key={paragraph.slice(0, 40)} className="mb-4 leading-relaxed text-muted-foreground">
                    {renderParagraphWithLink(
                      paragraph,
                      linkConfig ? { match: linkConfig.match, to: linkConfig.to } : undefined,
                    )}
                  </p>
                );
              })}
              {section.list && (
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {section.trailingParagraphs?.map((paragraph, paragraphIndex) => {
                const linkConfig = section.paragraphLinks?.find(
                  (item) => item.trailing && item.paragraphIndex === paragraphIndex,
                );
                return (
                  <p key={paragraph.slice(0, 40)} className="mt-4 leading-relaxed text-muted-foreground">
                    {renderParagraphWithLink(
                      paragraph,
                      linkConfig ? { match: linkConfig.match, to: linkConfig.to } : undefined,
                    )}
                  </p>
                );
              })}
            </section>
          ))}

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Сравнение подходов</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-sm">
                <thead>
                  <tr className="bg-muted">
                    {table.headers.map((header) => (
                      <th
                        key={header}
                        className="border border-border px-4 py-3 text-left font-semibold"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row) => (
                    <tr key={row.join("-")}>
                      {row.map((cell) => (
                        <td key={cell} className="border border-border px-4 py-3">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Часто задаваемые вопросы</h2>
            <div className="space-y-4">
              {faq.map((item) => (
                <div key={item.question}>
                  <h3 className="font-semibold mb-2">{item.question}</h3>
                  <p className="text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col sm:flex-row gap-4 mt-12">
            <Link
              to="/#session"
              className="inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
            >
              Записаться на бесплатную 30-минутную сессию
            </Link>
            <Link
              to="/emdr-therapy"
              className="inline-flex items-center justify-center border border-border px-6 py-3 rounded-lg font-semibold hover:bg-muted transition-colors"
            >
              Подробнее об EMDR →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServiceLandingPage;
