import Reveal from "./Reveal";
import { scrollToSession } from "@/lib/scrollToSession";

const plans = [
  { type: "Старт", name: "Сессия-знакомство", sub: "30 минут · Онлайн", price: "Бесплатно", priceClass: "text-[#2ECC71]", desc: "Познакомимся и определим, подходим ли друг другу. Зададите любые вопросы о формате — без давления и обязательств.", hot: false },
  { type: "Разово", name: "Одна консультация", sub: "Стратегическая сессия", price: "5 000 ₽", priceClass: "text-gradient", desc: "Разбор конкретной ситуации или «аспириновая» консультация — когда нужно решение прямо сейчас.", hot: false },
  { type: "Пакет", name: "5 сессий", sub: "Углублённая работа", price: "20 000 ₽", priceClass: "text-gradient", desc: "Расширенное погружение. Даёт заметные системные изменения в эмоциях, поведении и жизни.", hot: true },
  { type: "Полный курс", name: "10+1 сессий", sub: "Системная перестройка", price: "35 000 ₽", priceClass: "text-gradient", desc: "11 встреч: 1-я — знакомство и погружение, 10 — глубокая работа с вашим запросом и системой.", hot: false },
];

const PricingSection = () => {
  return (
    <>
      <div className="glow-line mx-6 lg:mx-[60px]" />
      <section className="px-6 lg:px-[60px] py-[72px] lg:py-[100px]" id="pricing">
        <Reveal className="text-center max-w-[700px] mx-auto mb-[60px]">
          <h2 className="text-[clamp(36px,4.5vw,60px)] font-extrabold tracking-tight leading-[1.1] mb-4">
            Форматы <span className="text-gradient">работы</span>
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Начните с бесплатной встречи — без обязательств и давления
          </p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p, i) => (
            <Reveal key={i}>
              <div className={`relative bg-card border rounded-lg p-6 transition-all duration-300 hover:-translate-y-1 ${p.hot ? "border-primary bg-primary/[0.05] hover:border-primary" : "border-[hsl(var(--card-border))] hover:border-primary/25"}`}>
                {p.hot && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold tracking-[0.1em] uppercase px-3.5 py-1 rounded-full whitespace-nowrap">
                    Популярный
                  </div>
                )}
                <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-primary mb-3.5">{p.type}</div>
                <div className="text-xl font-bold mb-1.5">{p.name}</div>
                <div className="text-[13px] text-muted-foreground mb-5">{p.sub}</div>
                <div className={`text-4xl font-extrabold tracking-tight mb-1 ${p.priceClass}`}>
                  {p.price}
                </div>
                <div className="text-[13px] text-muted-foreground leading-relaxed mt-[18px] pt-[18px] border-t border-border">
                  {p.desc}
                </div>
                <a
                  href="#session"
                  onClick={scrollToSession}
                  className={`block w-full mt-5 py-3 rounded-lg text-sm font-semibold text-center transition-all ${p.hot ? "bg-primary text-primary-foreground hover:bg-accent" : "bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"}`}
                >
                  Записаться →
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
};

export default PricingSection;
