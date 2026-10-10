import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import ReelsCtaButton from "@/components/reels/ReelsCtaButton";
import ReelsFaqAccordion from "@/components/reels/ReelsFaqAccordion";
import ReelsLandingForm from "@/components/reels/ReelsLandingForm";
import ReelsMessengerRow from "@/components/reels/ReelsMessengerRow";
import type { ReelsLandingPageConfig } from "@/data/reelsLandingPages";
import { faqListFor, resolveReelsLanding } from "@/data/reelsLandingResolve";
import {
  REELS_ABOUT_CREDENTIALS_LANDING,
  REELS_ABOUT_PHOTO,
  REELS_ABOUT_PHOTO_ALT,
  REELS_BLOCK8_PROBA,
  REELS_BLOCK8_SESSIYA,
  REELS_BRIDGE_AFTER_BLOCK,
  REELS_BRIDGE_AFTER_BLOCK_10,
  REELS_FORM_ANCHOR_ID,
  REELS_FORM_TITLE_PROBA,
  REELS_FORM_TITLE_SESSIYA,
  REELS_HERO_FOOTER_PROBA,
  REELS_HERO_FOOTER_SESSIYA,
  REELS_WORK_STEP_1,
  REELS_WORK_STEP_2,
  REELS_WORK_STEP_3_PROBA,
  REELS_WORK_STEP_3_SESSIYA,
} from "@/data/reelsLandingTopics";
import { initReelsScrollGoals, trackCtaClick } from "@/lib/reelsLandingAnalytics";
import {
  formatPriceRub,
  SESSION_PRICE_OFFLINE_RUB,
  SESSION_PRICE_ONLINE_RUB,
} from "@/lib/sessionPricing";

type Props = { config: ReelsLandingPageConfig };

const sectionClass = "flex flex-col gap-5";
const h2Class = "text-[clamp(26px,5.5vw,32px)] font-extrabold leading-tight tracking-tight";
const bodyClass = "text-[17px] text-muted-foreground leading-relaxed max-w-[36ch]";

const ReelsLandingPage = ({ config }: Props) => {
  const resolved = resolveReelsLanding(config);
  const { path, topic, offer } = resolved;
  const isProba = offer === "proba";
  const formTitle = isProba ? REELS_FORM_TITLE_PROBA : REELS_FORM_TITLE_SESSIYA;
  const block8 = isProba ? REELS_BLOCK8_PROBA : REELS_BLOCK8_SESSIYA;
  const workStep3 = isProba ? REELS_WORK_STEP_3_PROBA : REELS_WORK_STEP_3_SESSIYA;
  const heroFooter = isProba ? REELS_HERO_FOOTER_PROBA : REELS_HERO_FOOTER_SESSIYA;
  const faqItems = faqListFor(resolved);
  const formSubmitLabel = isProba ? REELS_FORM_TITLE_PROBA : REELS_FORM_TITLE_SESSIYA;

  const formRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    return initReelsScrollGoals({ offer, topic });
  }, [offer, topic]);

  useEffect(() => {
    const formEl = formRef.current;
    if (!formEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(formEl);
    return () => observer.disconnect();
  }, []);

  const pageTitle = isProba
    ? `Пробная сессия | ${topic === "razvod" ? "развод" : "утрата"}`
    : `Сессия 90 минут | ${topic === "razvod" ? "развод" : "утрата"}`;

  const Bridge = ({ blockNum }: { blockNum: number }) => (
    <p className="text-[13px] text-muted-foreground leading-relaxed pt-2">{REELS_BRIDGE_AFTER_BLOCK[blockNum]}</p>
  );

  const Cta = ({ blockNum }: { blockNum: number }) => (
    <div className="pt-4">
      <ReelsCtaButton
        offer={offer}
        topic={topic}
        label={resolved.ctaByBlock[blockNum]}
        block={blockNum}
      />
    </div>
  );

  const SessiyaPriceCards = ({ className = "" }: { className?: string }) => (
    <div className={`grid gap-3 ${className}`}>
      <div className="border border-border rounded-2xl p-5 bg-bg3 text-[16px]">
        Онлайн, 90 минут: {formatPriceRub(SESSION_PRICE_ONLINE_RUB)} ₽
      </div>
      <div className="border border-border rounded-2xl p-5 bg-bg3 text-[16px]">
        Очно в Москве, 90 минут: {formatPriceRub(SESSION_PRICE_OFFLINE_RUB)} ₽
      </div>
      <p className="text-[13px] text-muted-foreground">{resolved.block7PriceCaption}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <PageMeta title={pageTitle} description={resolved.subtitle} path={path} robots="noindex, nofollow" />

      <header className="px-5 py-4 border-b border-border flex items-center justify-center">
        <Link to="/" className="text-[15px] font-bold tracking-wide">
          Наталья Морозова
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-5 py-10 flex flex-col gap-20 md:gap-24">
        {/* 1 Hero */}
        <section className={sectionClass}>
          <h1 className="text-[clamp(28px,6.5vw,38px)] font-extrabold leading-[1.12] tracking-tight">
            {resolved.h1}
          </h1>
          <p className={bodyClass}>{resolved.subtitle}</p>
          {!isProba ? <SessiyaPriceCards /> : null}
          <Cta blockNum={1} />
          <p className="text-[13px] text-center text-muted-foreground">{heroFooter}</p>
          <Bridge blockNum={1} />
        </section>

        {/* 2 Узнаёте себя? */}
        <section className={sectionClass}>
          <h2 className={h2Class}>{resolved.painsTitle}</h2>
          <ul className="space-y-3 text-[17px] text-muted-foreground leading-relaxed list-disc pl-5 max-w-[36ch]">
            {resolved.pains.map((pain) => (
              <li key={pain}>{pain}</li>
            ))}
          </ul>
          <p className="text-[17px] text-foreground/90 leading-relaxed max-w-[36ch]">{resolved.painsClosing}</p>
          <Bridge blockNum={2} />
          <Cta blockNum={2} />
        </section>

        {/* 3 Почему не получается */}
        <section className={sectionClass}>
          <h2 className={h2Class}>{resolved.block3Title}</h2>
          <p className={bodyClass}>{resolved.block3Paragraphs[0]}</p>
          <p className={bodyClass}>{resolved.block3Paragraphs[1]}</p>
          <Bridge blockNum={3} />
        </section>

        {/* 4 EMDR */}
        <section className={sectionClass}>
          <h2 className={h2Class}>{resolved.block4Title}</h2>
          <p className={bodyClass}>{resolved.block4Text}</p>
          <ul className="space-y-2 text-[17px] text-muted-foreground leading-relaxed list-disc pl-5 max-w-[36ch]">
            {resolved.emdrBullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {resolved.emdrDisclaimer ? (
            <p className="text-[12px] text-muted-foreground leading-relaxed max-w-[36ch]">{resolved.emdrDisclaimer}</p>
          ) : null}
          <Bridge blockNum={4} />
          <Cta blockNum={4} />
        </section>

        {/* 5 Кто ведёт */}
        <section className={sectionClass}>
          <h2 className={h2Class}>Кто с вами будет работать</h2>
          <img
            src={REELS_ABOUT_PHOTO}
            alt={REELS_ABOUT_PHOTO_ALT}
            className="w-full max-w-[280px] rounded-2xl object-cover object-top aspect-[3/4]"
            width={400}
            height={533}
            loading="lazy"
          />
          <div>
            <p className="text-xl font-bold">Наталья Морозова</p>
            <p className="text-[17px] text-muted-foreground mt-1">Психолог, EMDR-терапевт</p>
          </div>
          <ul className="space-y-2.5 max-w-[36ch]">
            {REELS_ABOUT_CREDENTIALS_LANDING.map((c) => (
              <li key={c} className="flex items-start gap-3 text-[15px] text-muted-foreground leading-snug">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                {c}
              </li>
            ))}
          </ul>
          <Bridge blockNum={5} />
        </section>

        {/* 6 Что вы получите */}
        <section className={sectionClass}>
          <h2 className={h2Class}>{resolved.block7Title}</h2>
          <ul className="space-y-3 text-[17px] text-muted-foreground leading-relaxed list-disc pl-5 max-w-[36ch]">
            {resolved.block7Items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {!isProba ? <SessiyaPriceCards className="mt-2" /> : null}
          <Bridge blockNum={6} />
          <Cta blockNum={6} />
        </section>

        {/* 7 Как это проходит */}
        <section className={sectionClass}>
          <h2 className={h2Class}>Как это проходит</h2>
          <ol className="space-y-4 max-w-[36ch]">
            {[REELS_WORK_STEP_1, REELS_WORK_STEP_2, workStep3].map((step, i) => (
              <li key={step} className="flex gap-3 text-[17px] text-muted-foreground leading-relaxed">
                <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <Bridge blockNum={7} />
        </section>

        {/* 8 Если не подойдёт */}
        <section className={sectionClass}>
          <h2 className={h2Class}>{block8.title}</h2>
          <p className={bodyClass}>{block8.text}</p>
          <Bridge blockNum={8} />
        </section>

        {/* 9 FAQ */}
        <section className={sectionClass}>
          <h2 className={h2Class}>Частые вопросы</h2>
          <ReelsFaqAccordion items={faqItems} offer={offer} topic={topic} />
          <Bridge blockNum={9} />
          <Cta blockNum={9} />
        </section>

        {/* 10 Что будет, если ничего не менять */}
        <section className={sectionClass}>
          <h2 className={h2Class}>{resolved.block11Title}</h2>
          <p className={bodyClass}>{resolved.block11Text}</p>
          <p className="text-[13px] text-muted-foreground leading-relaxed pt-2">{REELS_BRIDGE_AFTER_BLOCK_10}</p>
        </section>

        {/* 11 Финал + форма */}
        <section ref={formRef} className={`${sectionClass} scroll-mt-6`}>
          <h2 className={h2Class}>{resolved.finalTitle}</h2>
          <p className={bodyClass}>{resolved.finalSubtitle}</p>

          <ReelsLandingForm
            id={REELS_FORM_ANCHOR_ID}
            offer={offer}
            topic={topic}
            formTitle={formTitle}
            submitLabel={formSubmitLabel}
            showSessionFormat={!isProba}
          />
          <ReelsMessengerRow offer={offer} topic={topic} />

          {isProba ? (
            <div className="border border-border rounded-2xl p-5 bg-bg3 text-[15px] leading-relaxed text-muted-foreground">
              Если после пробной сессии решите продолжить: сессия 90 минут, онлайн {formatPriceRub(SESSION_PRICE_ONLINE_RUB)} ₽, очно в Москве {formatPriceRub(SESSION_PRICE_OFFLINE_RUB)} ₽.
            </div>
          ) : null}

          <p className="text-[12px] text-muted-foreground leading-relaxed pt-4">
            Если вам сейчас очень плохо или есть мысли причинить себе вред, позвоните{" "}
            <a href="tel:112" className="underline">112</a>. Сессия не заменяет экстренную помощь.
          </p>
        </section>
      </main>

      {showSticky ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-background/95 border-t border-border backdrop-blur-md md:hidden">
          <button
            type="button"
            className="w-full min-h-12 bg-primary text-primary-foreground rounded-[10px] font-bold text-[15px]"
            onClick={() => {
              trackCtaClick({ offer, topic, block: 0 });
              document.getElementById(REELS_FORM_ANCHOR_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {resolved.stickyCta}
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default ReelsLandingPage;
