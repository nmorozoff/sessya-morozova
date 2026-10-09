import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import ReelsCtaButton from "@/components/reels/ReelsCtaButton";
import ReelsFaqAccordion from "@/components/reels/ReelsFaqAccordion";
import ReelsLandingForm from "@/components/reels/ReelsLandingForm";
import ReelsMessengerRow from "@/components/reels/ReelsMessengerRow";
import type { ReelsLandingPageConfig } from "@/data/reelsLandingPages";
import {
  POTERYA_LIVING_LOSS_PAIN,
  REELS_PROBA_FAQ,
  REELS_SESSIYA_FAQ,
  REELS_SHARED_FAQ,
  REELS_TOPIC_COPY,
  REELS_TOPIC_HEADLINES,
  REELS_WORK_STEPS,
} from "@/data/reelsLandingTopics";
import { initReelsScrollGoals } from "@/lib/reelsLandingAnalytics";
import {
  formatPriceRub,
  SESSION_PRICE_OFFLINE_RUB,
  SESSION_PRICE_ONLINE_RUB,
} from "@/lib/sessionPricing";

const ABOUT_PHOTO = "/images/about-photo-dark.jpg";

const CREDENTIALS = [
  "Психологическая работа с травматическим стрессом, ВШЭ",
  "EMDR (ДПДГ) терапия, Академия краткосрочной стратегической психотерапии",
  "Психологическое консультирование, Институт трансперсональной психологии",
  "Школа бизнес-психологов, Международный центр обучения",
  "Бизнес-тренер, ИПО",
];

type Props = { config: ReelsLandingPageConfig };

const ReelsLandingPage = ({ config }: Props) => {
  const { path, topic, offer, includeLivingLossPain, slotsRemainingThisWeek } = config;
  const headlines = REELS_TOPIC_HEADLINES[topic];
  const copy = REELS_TOPIC_COPY[topic];
  const isProba = offer === "proba";
  const ctaLabel = isProba ? "Записаться на знакомство" : "Записаться на сессию";
  const heroSubmit = isProba
    ? "Записаться на бесплатное знакомство 30 минут"
    : "Записаться на сессию";

  const pains = [...copy.pains];
  if (includeLivingLossPain && topic === "poterya") {
    pains.push(POTERYA_LIVING_LOSS_PAIN);
  }

  const faqItems = [
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

  const topicLabel = topic === "razvod" ? "развод" : "утрата";
  const title = isProba
    ? `Бесплатное знакомство 30 мин | ${topicLabel}`
    : `Сессия 90 мин | ${topicLabel}`;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <PageMeta
        title={title}
        description={headlines.metaDescription}
        path={path}
        robots="noindex, nofollow"
      />

      <header className="px-5 py-4 border-b border-border flex items-center justify-center">
        <Link to="/" className="text-[15px] font-bold tracking-wide">
          Наталья Морозова
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-5 py-8 flex flex-col gap-14">
        <section ref={heroRef} className="flex flex-col gap-6">
          <h1 className="text-[clamp(26px,6vw,34px)] font-extrabold leading-tight tracking-tight">
            {headlines.h1}
          </h1>
          <p className="text-[17px] text-muted-foreground leading-relaxed">{headlines.subtitle}</p>

          {!isProba ? (
            <div className="grid gap-3">
              <div className="border border-border rounded-2xl p-5 bg-bg3">
                <div className="text-sm text-muted-foreground">Онлайн, 90 минут</div>
                <div className="text-2xl font-bold mt-1">{formatPriceRub(SESSION_PRICE_ONLINE_RUB)} ₽</div>
              </div>
              <div className="border border-border rounded-2xl p-5 bg-bg3">
                <div className="text-sm text-muted-foreground">Очно в Москве, 90 минут</div>
                <div className="text-2xl font-bold mt-1">{formatPriceRub(SESSION_PRICE_OFFLINE_RUB)} ₽</div>
              </div>
              <p className="text-[13px] text-muted-foreground">Полноценная рабочая сессия 90 минут (оплачиваемая)</p>
            </div>
          ) : null}

          <ReelsLandingForm
            id="reels-form-hero"
            offer={offer}
            topic={topic}
            submitLabel={heroSubmit}
            showSessionFormat={!isProba}
          />
          <ReelsMessengerRow offer={offer} topic={topic} />
          <p className="text-[13px] text-center text-muted-foreground">
            Без обязательств продолжать. Всё конфиденциально.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-5">Узнаёте себя?</h2>
          <ul className="space-y-3 text-[15px] text-muted-foreground leading-relaxed list-disc pl-5">
            {pains.map((pain) => (
              <li key={pain}>{pain}</li>
            ))}
          </ul>
          <div className="mt-8 flex justify-center">
            <ReelsCtaButton offer={offer} topic={topic} label={ctaLabel} formId="reels-form-hero" />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-5">Чего вы можете бояться</h2>
          <div className="space-y-5">
            {copy.doubts.map((item) => (
              <div key={item.doubt} className="border border-border rounded-xl p-4 bg-bg3">
                <p className="font-medium text-[15px] mb-2">{item.doubt}</p>
                <p className="text-[15px] text-muted-foreground leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <ReelsCtaButton offer={offer} topic={topic} label={ctaLabel} formId="reels-form-bottom" />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-5">Что на самом деле происходит</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-4">{copy.normalization[0]}</p>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-4">{copy.normalization[1]}</p>
          <p className="text-[15px] text-foreground/90 leading-relaxed">{copy.emdrNote}</p>
          <div className="mt-8 flex justify-center">
            <ReelsCtaButton offer={offer} topic={topic} label={ctaLabel} formId="reels-form-bottom" />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-5">Как проходит работа</h2>
          <ol className="space-y-4">
            {REELS_WORK_STEPS.map((step, i) => (
              <li key={step} className="flex gap-3 text-[15px] text-muted-foreground leading-relaxed">
                <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-5">Кто ведёт</h2>
          <img
            src={ABOUT_PHOTO}
            alt="Наталья Морозова, психолог и EMDR-терапевт"
            className="w-full max-w-xs rounded-2xl object-cover aspect-[3/4] mb-5"
            width={400}
            height={533}
            fetchPriority="high"
          />
          <p className="text-xl font-bold mb-1">Наталья Морозова</p>
          <p className="text-[15px] text-muted-foreground mb-4">Психолог, EMDR-терапевт</p>
          <ul className="space-y-2 text-[13px] text-muted-foreground">
            {CREDENTIALS.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex justify-center">
            <ReelsCtaButton offer={offer} topic={topic} label={ctaLabel} formId="reels-form-bottom" />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-5">Вопросы и ответы</h2>
          <ReelsFaqAccordion items={[...faqItems]} offer={offer} topic={topic} />
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold">
            {isProba ? "Бесплатное знакомство 30 минут" : "Запись на сессию 90 минут"}
          </h2>
          {isProba ? (
            <div className="text-[15px] text-muted-foreground leading-relaxed space-y-3">
              <p>
                Знакомство: вы рассказываете, что беспокоит, я отвечаю, подойдёт ли вам EMDR и как может выглядеть
                работа. Это не полноценная терапевтическая сессия. Формат: онлайн.
              </p>
              {typeof slotsRemainingThisWeek === "number" ? (
                <p className="text-foreground font-medium">
                  Свободных слотов на этой неделе: {slotsRemainingThisWeek}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-[15px] text-muted-foreground">
              Рабочая сессия 90 минут — онлайн или очно в Москве. Выберите формат в форме.
            </p>
          )}

          <ReelsLandingForm
            id="reels-form-bottom"
            offer={offer}
            topic={topic}
            submitLabel={heroSubmit}
            showSessionFormat={!isProba}
          />
          <ReelsMessengerRow offer={offer} topic={topic} />

          {isProba ? (
            <div className="border border-border rounded-2xl p-5 bg-bg3 text-[15px] leading-relaxed text-muted-foreground">
              Если после знакомства решите продолжить: сессия 90 минут, онлайн{" "}
              {formatPriceRub(SESSION_PRICE_ONLINE_RUB)} ₽, очно в Москве{" "}
              {formatPriceRub(SESSION_PRICE_OFFLINE_RUB)} ₽.
            </div>
          ) : null}
        </section>

        <p className="text-[12px] text-muted-foreground leading-relaxed border-t border-border pt-6">
          Сессия не заменяет экстренную помощь. Если вам сейчас очень плохо или есть мысли причинить себе вред,
          позвоните <a href="tel:112" className="underline">112</a>.
        </p>
      </main>

      {showSticky ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-background/95 border-t border-border backdrop-blur-md md:hidden">
          <button
            type="button"
            className="w-full min-h-12 bg-primary text-primary-foreground rounded-[10px] font-bold text-[15px]"
            onClick={() => {
              document.getElementById("reels-form-bottom")?.scrollIntoView({ behavior: "smooth" });
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
