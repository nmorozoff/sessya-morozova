import heroPhoto from "@/assets/hero-photo-dark.jpg";

const Hero = () => {
  return (
    <section className="min-h-screen grid grid-cols-1 lg:grid-cols-2 items-center px-6 lg:px-[60px] pt-[100px] pb-[60px] gap-10 lg:gap-[60px] relative overflow-hidden">
      {/* Glow */}
      <div className="absolute -top-[200px] right-[300px] w-[600px] h-[600px] pointer-events-none" style={{ background: "var(--gradient-glow-orange)" }} />

      <div>
        <div className="inline-block bg-primary/10 border border-primary/25 text-primary text-xs font-semibold tracking-[0.12em] uppercase px-4 py-1.5 rounded-full mb-6 opacity-0 animate-[fadeUp_0.6s_0.1s_forwards]">
          Психолог · Работаю онлайн
        </div>
        <h1 className="text-[clamp(44px,5.5vw,80px)] font-black leading-[1.05] mb-6 tracking-tight opacity-0 animate-[fadeUp_0.7s_0.2s_forwards]">
          Когда внутри<br />что-то пошло<br /><span className="text-gradient">не так</span>
        </h1>
        <p className="text-[17px] leading-relaxed text-muted-foreground max-w-[500px] mb-10 opacity-0 animate-[fadeUp_0.7s_0.35s_forwards]">
          Помогаю найти связь между вашими симптомами и тем, что происходит в жизни — без общих фраз и бесконечных разговоров. Конкретные точки изменений. В вашем ритме.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center opacity-0 animate-[fadeUp_0.7s_0.45s_forwards]">
          <a href="#session" className="bg-primary text-primary-foreground px-9 py-4 rounded-[10px] text-[15px] font-bold hover:bg-accent hover:translate-y-[-2px] hover:shadow-[var(--shadow-orange)] transition-all inline-flex items-center gap-2 justify-center">
            Записаться бесплатно →
          </a>
          <a href="#about" className="bg-foreground/[0.06] text-foreground px-9 py-4 rounded-[10px] text-[15px] font-semibold border border-border hover:bg-foreground/10 transition-all text-center">
            Узнать больше
          </a>
        </div>
      </div>

      {/* Photo column - on mobile first */}
      <div className="relative order-first lg:order-last">
        <div className="relative overflow-hidden opacity-0 animate-[fadeIn_1s_0.3s_forwards]">
          <img src={heroPhoto} alt="Наталья Морозова" className="w-full aspect-[3/4] lg:aspect-[3/4] object-cover object-[center_30%] block scale-110" />
          <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-background to-transparent" />
          <div className="absolute bottom-8 left-8 bg-background/85 backdrop-blur-xl border border-border rounded-xl px-5 py-3.5 z-10">
            <div className="text-[11px] text-muted-foreground mb-1">Первая встреча</div>
            <div className="text-base font-bold text-primary">Бесплатно — 30 мин</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
