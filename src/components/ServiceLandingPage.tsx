import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import PageMeta from "@/components/PageMeta";
import { medicalConditionSchema, buildFaqPageSchema } from "@/lib/schema";
import { servicePageUrl, type ServicePageConfig } from "@/lib/services/types";
import { Link } from "react-router-dom";

type ServiceLandingPageProps = ServicePageConfig;

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
  conditionName,
  conditionDescription,
}: ServiceLandingPageProps) => {
  const pageUrl = servicePageUrl(slug);
  const conditionSchema = medicalConditionSchema(conditionName, conditionDescription, pageUrl);
  const faqSchema = buildFaqPageSchema(faq);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageMeta title={title} description={description} path={`/${slug}`} />
      <JsonLd id={`condition-${slug}`} data={conditionSchema} />
      <JsonLd id={`faq-${slug}`} data={faqSchema} />
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

          <p className="text-lg leading-relaxed mb-5 text-foreground/90">{geoBlock}</p>

          <p className="leading-relaxed mb-8 text-muted-foreground">{intro}</p>

          {sections.map((section) => (
            <section key={section.h2} className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">{section.h2}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="mb-4 leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
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
