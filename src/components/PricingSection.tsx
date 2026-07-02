import Reveal from "./Reveal";
import { scrollToSession } from "@/lib/scrollToSession";

const plans = [
  { type: "Старт", name: "Пробная сессия", sub: "30 минут · Онлайн", price: "Бесплатно", priceClass: "text-[#2ECC71]", desc: "Познакомимся и определим, подходим ли друг другу. Зададите любые вопросы о формате — без давления и обязательств.", hot: false },
  { type: "Регулярно", name: "Сессия ОНЛАЙН", sub: "90 минут (1,5 часа)", price: "5 000 ₽", priceClass: "text-gradient", desc: "Глубокая работа с вашим запросом в комфортной для вас обстановке из любой точки мира.", hot: true },
  { type: "В кабинете", name: "Сессия ОЧНО", sub: "90 минут (1,5 часа) · Москва", price: "6 500 ₽", priceClass: "text-gradient", desc: "Личная встреча в уютном кабинете (2 мин от м. Тургеневская / Чистые пруды, или 2 мин от м. Ботанический сад МЦК).", hot: false },
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        <Reveal className="mt-[60px]">
          <div className="bg-card border border-[hsl(var(--card-border))] rounded-2xl p-6 lg:p-10">
            <h3 className="text-2xl font-bold mb-4">Очные сессии в Москве</h3>
            <p className="text-muted-foreground mb-8">
              Кабинеты находятся в пешей доступности от метро. Уютная и безопасная атмосфера для комфортной работы.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="aspect-video rounded-xl overflow-hidden relative">
                  <img
                    src="/images/office-1.png"
                    alt="Интерьер кабинета психолога для очных сессий у метро Тургеневская и Чистые пруды в Москве"
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">м. Тургеневская / Чистые пруды</h4>
                  <p className="text-sm text-muted-foreground">2 минуты от метро</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="aspect-video rounded-xl overflow-hidden relative">
                  <img
                    src="/images/office-2.png"
                    alt="Интерьер кабинета психолога для очных консультаций у метро Ботанический сад и МЦК в Москве"
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">м. Ботанический сад (МЦК)</h4>
                  <p className="text-sm text-muted-foreground">2 минуты от метро</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
};

export default PricingSection;
