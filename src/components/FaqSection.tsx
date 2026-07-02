import Reveal from "./Reveal";
import JsonLd from "./JsonLd";
import { faqPageSchema, homepageFaqItems } from "@/lib/schema";

const FaqSection = () => {
  return (
    <>
      <JsonLd id="faq-page" data={faqPageSchema} />
      <div className="glow-line mx-6 lg:mx-[60px]" />
      <section className="px-6 lg:px-[60px] py-[72px] lg:py-[100px] bg-bg2" id="faq">
        <Reveal className="text-center max-w-[700px] mx-auto mb-[60px]">
          <h2 className="text-[clamp(36px,4.5vw,60px)] font-extrabold tracking-tight leading-[1.1] mb-4">
            Часто задаваемые <span className="text-gradient">вопросы</span>
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Короткие ответы о методе, форматах и стоимости
          </p>
        </Reveal>
        <div className="max-w-3xl mx-auto space-y-6">
          {homepageFaqItems.map((item, i) => (
            <Reveal key={i}>
              <article className="bg-bg3 border border-[hsl(var(--card-border))] rounded-xl p-6 lg:p-8">
                <h3 className="text-lg font-bold mb-3">{item.question}</h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">{item.answer}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
};

export default FaqSection;
