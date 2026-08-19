const heroPhoto = "/images/hero-photo-dark.jpg";
import { scrollToSession } from "@/lib/scrollToSession";

const Hero = () => {
  return (
    <section data-hero-section className="min-h-screen grid grid-cols-1 lg:grid-cols-2 items-center px-6 lg:px-[60px] pt-16 lg:pt-[100px] pb-8 lg:pb-[60px] gap-4 lg:gap-[60px] relative overflow-hidden">
      {/* Glow */}
      <div className="absolute -top-[200px] right-[300px] w-[600px] h-[600px] pointer-events-none" style={{ background: "var(--gradient-glow)" }} />

      <div>
        <div className="inline-block bg-primary/10 border border-primary/25 text-primary text-xs font-semibold tracking-[0.12em] uppercase px-4 py-1.5 rounded-full mb-6 opacity-0 animate-[fadeUp_0.6s_0.1s_forwards]">
          Психолог · Онлайн и Очно
        </div>
        <p className="text-[clamp(28px,5.5vw,45px)] font-semibold text-primary leading-tight mb-6 opacity-0 animate-[fadeUp_0.7s_0.15s_forwards]">
          Наталья Морозова · Психолог, EMDR-терапевт
        </p>
        <h1 className="text-[clamp(18px,2vw,24px)] font-medium leading-snug text-foreground/75 max-w-[600px] mb-5 opacity-0 animate-[fadeUp_0.7s_0.2s_forwards]">
          Как избавиться от тревоги, панических атак и травмы с помощью EMDR-терапии?
        </h1>
        <p className="text-[17px] leading-relaxed text-foreground/90 max-w-[560px] mb-4 opacity-0 animate-[fadeUp_0.7s_0.25s_forwards]">
          Наталья Морозова — сертифицированный психолог и EMDR-терапевт в Москве и онлайн. Метод EMDR (ДПДГ)
          рекомендован ВОЗ для работы с ПТСР, паническими атаками и фобиями. Переработка травматического опыта на
          нейробиологическом уровне за 1–6 сессий. Очные кабинеты у м. Тургеневская и м. Ботанический сад.
        </p>
        <h2 className="text-[clamp(18px,2vw,24px)] font-medium leading-snug text-foreground/75 max-w-[600px] mb-6 opacity-0 animate-[fadeUp_0.7s_0.3s_forwards]">
          Терапия для тех, кто устал жить в постоянном напряжении
        </h2>
        <p className="text-[17px] leading-relaxed text-muted-foreground max-w-[500px] mb-10 opacity-0 animate-[fadeUp_0.7s_0.35s_forwards]">
          Помогаю найти связь между вашими симптомами и тем, что происходит в жизни — без общих фраз и бесконечных разговоров. Конкретные точки изменений. В вашем ритме.
        </p>
        <div className="w-full flex justify-center opacity-0 animate-[fadeUp_0.7s_0.45s_forwards]">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <a href="#session" onClick={scrollToSession} className="bg-primary text-primary-foreground px-9 py-4 rounded-[10px] text-[15px] font-bold hover:bg-accent hover:translate-y-[-2px] hover:shadow-[var(--shadow-primary)] transition-all inline-flex items-center gap-2 justify-center text-center">
              Записаться на бесплатную 30 минутную пробную сессию
            </a>
            <a href="#about" className="bg-foreground/[0.06] text-foreground px-9 py-4 rounded-[10px] text-[15px] font-semibold border border-border hover:bg-foreground/10 transition-all text-center">
              Узнать больше
            </a>
          </div>
        </div>
      </div>

      {/* Photo column - on mobile first */}
      <div className="relative order-first lg:order-last">
        <div className="relative overflow-hidden opacity-0 animate-[fadeIn_1s_0.3s_forwards]">
          <img
            src={heroPhoto}
            alt="Психолог и EMDR-терапевт Наталья Морозова, проводит онлайн и очные консультации в Москве"
            fetchPriority="high"
            className="w-full aspect-[3/4] lg:aspect-[3/4] object-cover object-[center_45%] block scale-125"
          />
          <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-background to-transparent" />
          <div className="absolute bottom-8 -left-0.5 lg:left-8 bg-background/85 backdrop-blur-xl border border-border rounded-r-xl lg:rounded-xl px-5 py-3.5 z-10">
            <div className="text-[11px] text-muted-foreground mb-1">Первая встреча</div>
            <div className="text-base font-bold text-gradient">Бесплатно — 30 мин</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
