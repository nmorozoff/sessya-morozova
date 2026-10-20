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
  REELS_FORM_BOTTOM_ID,
  REELS_FORM_HERO_ID,
  REELS_HERO_FOOTER_PROBA,
  REELS_HERO_FOOTER_SESSIYA,
  REELS_LANDING_HEADER_TITLE,
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

const sectionClass = "flex flex-col gap-6";
const h2Class = "text-[clamp(26px,5.5vw,32px)] font-extrabold leading-tight tracking-tight";
const bodyClass = "text-[17px] text-muted-foreground leading-relaxed max-w-[36ch]";
const bridgeClass = "text-[13px] text-muted-foreground leading-relaxed max-w-[36ch]";
/** Одинаковые «поля» между смысловым блоком и следующим заголовком */
const transitionWrapClass = "flex flex-col gap-5 py-10 md:py-11 w-full max-w-[36ch]";
const mainClass = "max-w-xl mx-auto px-5 py-10 flex flex-col";

const ReelsLandingPage = ({ config }: Props) => {
  const resolved = resolveReelsLanding(config);
  const { path, topic, offer } = resolved;
  const isProba = offer === "proba";
  const block8 = isProba ? REELS_BLOCK8_PROBA : REELS_BLOCK8_SESSIYA;
  const workStep3 = isProba ? REELS_WORK_STEP_3_PROBA : REELS_WORK_STEP_3_SESSIYA;
  const heroFooter = isProba ? REELS_HERO_FOOTER_PROBA : REELS_HERO_FOOTER_SESSIYA;
  const faqItems = faqListFor(resolved);

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

  const BlockTransition = ({
    blockNum,
    text,
    withCta = false,
  }: {
    blockNum?: number;
    text?: string;
    withCta?: boolean;
  }) => {
    const bridgeText = text ?? (blockNum != null ? REELS_BRIDGE_AFTER_BLOCK[blockNum] : "");
    if (!bridgeText && !withCta) return null;

    return (
      <div className={transitionWrapClass}>
        {bridgeText ? <p className={bridgeClass}>{bridgeText}</p> : null}
        {withCta && blockNum != null ? (
          <ReelsCtaButton
            offer={offer}
            topic={topic}
            label={resolved.ctaByBlock[blockNum]}
            block={blockNum}
          />
        ) : null}
      </div>
    );
  };

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

      <header className="px-5 py-4 border-b border-border flex items-center justify-center text-center">
        <Link
          to="/"
          className="text-[13px] sm:text-[15px] font-bold tracking-wide leading-snug max-w-[36ch] text-balance"
        >
          {REELS_LANDING_HEADER_TITLE}
        </Link>
      </header>

      <main className={mainClass}>
        {/* 1 Hero */}
        <section ref={formRef} className={`${sectionClass} scroll-mt-6`}>
          <h1 className="text-[clamp(28px,6.5vw,38px)] font-extrabold leading-[1.12] tracking-tight">
            {resolved.h1}
          </h1>
          <p className={bodyClass}>{resolved.subtitle}</p>
          {!isProba ? <SessiyaPriceCards /> : null}
          <ReelsLandingForm
            id={REELS_FORM_HERO_ID}
            offer={offer}
            topic={topic}
            formTitle={resolved.formTitle}
            submitLabel={resolved.formSubmitLabel}
            showSessionFormat={!isProba}
            showTitle={false}
          />
          <p className="text-[13px] text-center text-muted-foreground max-w-[36ch] w-full mx-auto">{heroFooter}</p>
        </section>

        <BlockTransition blockNum={1} />

        {/* 2 Узнаёте себя? */}
        <section className={sectionClass}>
          <h2 className={h2Class}>{resolved.painsTitle}</h2>
          <ul className="space-y-3 text-[17px] text-muted-foreground leading-relaxed list-disc pl-5 max-w-[36ch]">
            {resolved.pains.map((pain) => (
              <li key={pain}>{pain}</li>
            ))}
          </ul>
          <p className="text-[17px] text-foreground/90 leading-relaxed max-w-[36ch]">{resolved.painsClosing}</p>
        </section>

        <BlockTransition blockNum={2} withCta />

        {/* 3 Почему не получается */}
        <section className={sectionClass}>
          <h2 className={h2Class}>{resolved.block3Title}</h2>
          <p className={bodyClass}>{resolved.block3Paragraphs[0]}</p>
          <p className={bodyClass}>{resolved.block3Paragraphs[1]}</p>
        </section>

        <BlockTransition blockNum={3} />

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
        </section>

        <BlockTransition blockNum={4} withCta />

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
        </section>

        <BlockTransition blockNum={5} />

        {/* 6 Что вы получите */}
        <section className={sectionClass}>
          <h2 className={h2Class}>{resolved.block7Title}</h2>
          <ul className="space-y-3 text-[17px] text-muted-foreground leading-relaxed list-disc pl-5 max-w-[36ch]">
            {resolved.block7Items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {!isProba ? <SessiyaPriceCards /> : null}
        </section>

        <BlockTransition blockNum={6} withCta />

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
        </section>

        <BlockTransition blockNum={7} />

        {/* 8 Если не подойдёт */}
        <section className={sectionClass}>
          <h2 className={h2Class}>{block8.title}</h2>
          <p className={bodyClass}>{block8.text}</p>
        </section>

        <BlockTransition blockNum={8} />

        {/* 9 FAQ */}
        <section className={sectionClass}>
          <h2 className={h2Class}>Частые вопросы</h2>
          <ReelsFaqAccordion items={faqItems} offer={offer} topic={topic} />
        </section>

        <BlockTransition blockNum={9} withCta />

        {/* 10 Что будет, если ничего не менять */}
        <section className={sectionClass}>
          <h2 className={h2Class}>{resolved.block11Title}</h2>
          <p className={bodyClass}>{resolved.block11Text}</p>
        </section>

        <BlockTransition text={REELS_BRIDGE_AFTER_BLOCK_10} />

        {/* 11 Финал + форма */}
        <section className={`${sectionClass} scroll-mt-6`}>
          <h2 className={h2Class}>{resolved.finalTitle}</h2>
          <p className={bodyClass}>{resolved.finalSubtitle}</p>

          <ReelsLandingForm
            id={REELS_FORM_BOTTOM_ID}
            offer={offer}
            topic={topic}
            formTitle={resolved.formTitle}
            submitLabel={resolved.formSubmitLabel}
            showSessionFormat={!isProba}
          />
          <ReelsMessengerRow offer={offer} topic={topic} />

          {isProba ? (
            <div className="border border-border rounded-2xl p-5 bg-bg3 text-[15px] leading-relaxed text-muted-foreground">
              Если после пробной сессии решите продолжить: сессия 90 минут, онлайн {formatPriceRub(SESSION_PRICE_ONLINE_RUB)} ₽, очно в Москве {formatPriceRub(SESSION_PRICE_OFFLINE_RUB)} ₽.
            </div>
          ) : null}

          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Если вам сейчас очень плохо или есть мысли причинить себе вред, позвоните{" "}
            <a href="tel:112" className="underline">112</a>. Сессия не заменяет экстренную помощь.
          </p>
        </section>
      </main>

      {showSticky ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-background/95 border-t border-border backdrop-blur-md md:hidden">
          <button
            type="button"
            className="w-full min-h-12 bg-primary text-primary-foreground rounded-[10px] font-bold text-[15px] text-center leading-snug px-3"
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
