import Reveal from "./Reveal";

const topics = [
  { cat: "Тревога и страхи", items: ["Генерализованная тревога", "Панические атаки", "Социальная тревога", "Страх будущего, катастрофизация", "Навязчивые мысли"] },
  { cat: "Психосоматика", items: ["Головные боли и мигрени", "Проблемы с ЖКТ", "Нарушения сна", "Кожные реакции, хроническое напряжение", "Учащённое сердцебиение"] },
  { cat: "Кризисные состояния", items: ["Развод и сложности в отношениях", "Потеря работы, смена пути", "Потеря близких, горе", "Экзистенциальный кризис", "Выгорание, потеря смысла"] },
  { cat: "Эмоции и поведение", items: ["Вспышки гнева, подавление эмоций", "Неспособность радоваться", "Трудности с установлением границ", "Эмоциональная нестабильность", "Трудности в близких отношениях"] },
  { cat: "Бизнес и предприниматели", items: ["Синдром самозванца", "Страх делегировать и отпустить контроль", "Страх больших денег и успеха", "Системные сбои через призму психологии", "Перфекционизм и выгорание владельца"] },
  { cat: "Травматический опыт", items: ["Последствия насилия", "Буллинг и травля", "Сложные семейные отношения", "ДТП, несчастные случаи", "Медицинская травма"] },
];

const TopicsSection = () => {
  return (
    <>
      <div className="glow-line mx-6 lg:mx-[60px]" />
      <section className="px-6 lg:px-[60px] py-[72px] lg:py-[100px] bg-bg2">
        <Reveal className="text-center max-w-[700px] mx-auto mb-[60px]">
          <h2 className="text-[clamp(36px,4.5vw,60px)] font-extrabold tracking-tight leading-[1.1] mb-4">
            Запросы, с которыми <span className="text-gradient">работаю</span>
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Широкий спектр — от тревожности до кризисов в бизнесе
          </p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((t, i) => (
            <Reveal key={i}>
              <div className="bg-bg3 border border-[hsl(var(--card-border))] rounded-lg p-7">
                <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-primary mb-4 pb-3 border-b border-border">
                  {t.cat}
                </div>
                <div className="flex flex-col gap-2">
                  {t.items.map((item, j) => (
                    <div key={j} className="text-sm text-foreground/70 pl-3.5 relative leading-snug before:content-['·'] before:absolute before:left-0 before:text-primary before:font-bold">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
};

export default TopicsSection;
