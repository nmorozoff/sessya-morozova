import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import ReelsCtaButton from "@/components/reels/ReelsCtaButton";
import ReelsFaqAccordion from "@/components/reels/ReelsFaqAccordion";
import ReelsLandingForm from "@/components/reels/ReelsLandingForm";
import ReelsMessengerRow from "@/components/reels/ReelsMessengerRow";
import type { ReelsLandingPageConfig } from "@/data/reelsLandingPages";
import {
  REELS_ABOUT_CREDENTIALS,
  REELS_ABOUT_LEAD,
  REELS_ABOUT_PARAGRAPHS,
  REELS_ABOUT_PHOTO,
  REELS_ABOUT_PHOTO_ALT,
  REELS_ABOUT_QUOTE,
  REELS_BLOCK7_PROBA,
  REELS_BLOCK7_SESSIYA,
  REELS_BLOCK8_PROBA,
  REELS_BLOCK8_SESSIYA,
  REELS_CTA_CAPTION,
  REELS_CTA_PROBA,
  REELS_CTA_SESSIYA,
  REELS_EMDR_BULLETS,
  REELS_EMDR_DISCLAIMER,
  REELS_FINAL_PROBA,
  REELS_FINAL_SESSIYA,
  REELS_FORM_FOOTER_PROBA,
  REELS_FORM_FOOTER_SESSIYA,
  REELS_FORM_TITLE_PROBA,
  REELS_FORM_TITLE_SESSIYA,
  REELS_PROBA_FAQ,
  REELS_SESSIYA_FAQ,
  REELS_SHARED_FAQ,
  REELS_TOPIC_COPY,
  REELS_WORK_STEP_1,
  REELS_WORK_STEP_2,
  REELS_WORK_STEP_3_PROBA,
  REELS_WORK_STEP_3_SESSIYA,
} from "@/data/reelsLandingTopics";
import { initReelsScrollGoals } from "@/lib/reelsLandingAnalytics";
import {
  formatPriceRub,
  SESSION_PRICE_OFFLINE_RUB,
  SESSION_PRICE_ONLINE_RUB,
} from "@/lib/sessionPricing";

const FORM_ID = "reels-form-bottom";

type Props = { config: ReelsLandingPageConfig };

const ReelsLandingPage = ({ config }: Props) => {
  const { path, topic, offer } = config;
  const copy = REELS_TOPIC_COPY[topic];
  const isProba = offer === "proba";
  const ctaLabel = isProba ? REELS_CTA_PROBA : REELS_CTA_SESSIYA;
  const subtitle = isProba ? copy.subtitleProba : copy.subtitleSessiya;
  const formTitle = isProba ? REELS_FORM_TITLE_PROBA : REELS_FORM_TITLE_SESSIYA;
  const formFooter = isProba ? REELS_FORM_FOOTER_PROBA : REELS_FORM_FOOTER_SESSIYA;
  const finalBlock = isProba ? REELS_FINAL_PROBA : REELS_FINAL_SESSIYA;
  const block8 = isProba ? REELS_BLOCK8_PROBA : REELS_BLOCK8_SESSIYA;
  const workStep3 = isProba ? REELS_WORK_STEP_3_PROBA : REELS_WORK_STEP_3_SESSIYA;

  const faqItems = [
    ...copy.thematicFaq,
    ...REELS_SHARED_FAQ,
    isProba ? REELS_PROBA_FAQ : REELS_SESSIYA_FAQ,
  ];

  const heroRef = useRef<HTMLElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    return initReelsScrollGoals({ offer, topic });
  }, [offer, topic]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const pageTitle = isProba ? `Пробная сессия | ${topic === "razvod" ? "развод" : "утрата"}` : `Сессия 90 минут | ${topic === "razvod" ? "развод" : "утрата"}`;

  const Cta = () => (
    <div className="mt-8 flex flex-col items-center gap-2">
      <ReelsCtaButton offer={offer} topic={topic} label={ctaLabel} formId={FORM_ID} />
      <p className="text-[13px] text-center text-muted-foreground">{REELS_CTA_CAPTION}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <PageMeta title={pageTitle} description={subtitle} path={path} robots="noindex, nofollow" />

      <header className="px-5 py-4 border-b border-border flex items-center justify-center">
        <Link to="/" className="text-[15px] font-bold tracking-wide">
          Наталья Морозова
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-5 py-8 flex flex-col gap-14">
        <section ref={heroRef} className="flex flex-col gap-6">
          <h1 className="text-[clamp(26px,6vw,34px)] font-extrabold leading-tight tracking-tight">
            {copy.h1}
          </h1>
          <p className="text-[17px] text-muted-foreground leading-relaxed">{subtitle}</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-5">{copy.painsTitle}</h2>
          <ul className="space-y-3 text-[15px] text-muted-foreground leading-relaxed list-disc pl-5">
            {copy.pains.map((pain) => (
              <li key={pain}>{pain}</li>
            ))}
          </ul>
          <p className="mt-5 text-[15px] text-foreground/90 leading-relaxed">{copy.painsClosing}</p>
          <Cta />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-5">{copy.block3Title}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-4">{copy.block3Paragraphs[0]}</p>
          <p className="text-[15px] text-muted-foreground leading-relaxed">{copy.block3Paragraphs[1]}</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-5">{copy.block4Title}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-5">{copy.block4Text}</p>
          <ul className="space-y-2 text-[15px] text-muted-foreground leading-relaxed list-disc pl-5 mb-4">
            {REELS_EMDR_BULLETS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-[12px] text-muted-foreground leading-relaxed">{REELS_EMDR_DISCLAIMER}</p>
          <Cta />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-5">Кто с вами будет работать</h2>
          <img
            src={REELS_ABOUT_PHOTO}
            alt={REELS_ABOUT_PHOTO_ALT}
            className="w-full max-w-xs rounded-2xl object-cover object-top aspect-[3/4] mb-5"
            width={400}
            height={533}
            loading="lazy"
          />
          <p className="text-[15px] font-medium mb-4">{REELS_ABOUT_LEAD}</p>
          <blockquote className="text-[15px] italic text-foreground/80 leading-relaxed mb-4 p-4 bg-primary/[0.06] border-l-[3px] border-primary rounded-r-xl">
            {REELS_ABOUT_QUOTE}
          </blockquote>
          {REELS_ABOUT_PARAGRAPHS.map((p) => (
            <p key={p} className="text-[15px] text-muted-foreground leading-relaxed mb-3.5">
              {p}
            </p>
          ))}
          <ul className="mt-4 space-y-2.5">
            {REELS_ABOUT_CREDENTIALS.map((c) => (
              <li key={c} className="flex items-start gap-3 text-[13px] text-foreground/60 leading-snug">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                {c}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-5">Как это проходит</h2>
          <ol className="space-y-4">
            {[REELS_WORK_STEP_1, REELS_WORK_STEP_2, workStep3].map((step, i) => (
              <li key={step} className="flex gap-3 text-[15px] text-muted-foreground leading-relaxed">
                <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <Cta />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-5">
            {isProba ? REELS_BLOCK7_PROBA.title : REELS_BLOCK7_SESSIYA.title}
          </h2>
          <ul className="space-y-3 text-[15px] text-muted-foreground leading-relaxed list-disc pl-5">
            {(isProba ? REELS_BLOCK7_PROBA.items : REELS_BLOCK7_SESSIYA.items).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {!isProba ? (
            <div className="mt-6 grid gap-3">
              <div className="border border-border rounded-2xl p-5 bg-bg3 text-[15px]">
                Онлайн, 90 минут: {formatPriceRub(SESSION_PRICE_ONLINE_RUB)} ₽
              </div>
              <div className="border border-border rounded-2xl p-5 bg-bg3 text-[15px]">
                Очно в Москве, 90 минут: {formatPriceRub(SESSION_PRICE_OFFLINE_RUB)} ₽
              </div>
              <p className="text-[13px] text-muted-foreground">{REELS_BLOCK7_SESSIYA.priceCaption}</p>
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">{block8.title}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">{block8.text}</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-5">Частые вопросы</h2>
          <ReelsFaqAccordion items={faqItems} offer={offer} topic={topic} />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">{copy.block11Title}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">{copy.block11Text}</p>
          <Cta />
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold">{finalBlock.title}</h2>
          <p className="text-[17px] text-muted-foreground leading-relaxed">{finalBlock.subtitle}</p>

          <ReelsLandingForm
            id={FORM_ID}
            offer={offer}
            topic={topic}
            formTitle={formTitle}
            submitLabel={ctaLabel}
            showSessionFormat={!isProba}
          />
          <p className="text-[13px] text-center text-muted-foreground -mt-2">{formFooter}</p>
          <ReelsMessengerRow offer={offer} topic={topic} />
        </section>

        {isProba ? (
          <div className="border border-border rounded-2xl p-5 bg-bg3 text-[15px] leading-relaxed text-muted-foreground">
            Если после пробной сессии решите продолжить: сессия 90 минут, онлайн {formatPriceRub(SESSION_PRICE_ONLINE_RUB)} ₽, очно в Москве {formatPriceRub(SESSION_PRICE_OFFLINE_RUB)} ₽.
          </div>
        ) : null}

        <p className="text-[12px] text-muted-foreground leading-relaxed border-t border-border pt-6">
          Если вам сейчас очень плохо или есть мысли причинить себе вред, позвоните{" "}
          <a href="tel:112" className="underline">112</a>. Сессия не заменяет экстренную помощь.
        </p>
      </main>

      {showSticky ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-background/95 border-t border-border backdrop-blur-md md:hidden">
          <button
            type="button"
            className="w-full min-h-12 bg-primary text-primary-foreground rounded-[10px] font-bold text-[15px]"
            onClick={() => {
              document.getElementById(FORM_ID)?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {ctaLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default ReelsLandingPage;
