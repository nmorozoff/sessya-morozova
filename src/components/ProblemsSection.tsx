import Reveal from "./Reveal";

const problems = [
  { icon: "😰", title: "Тревога и панические атаки", desc: "Навязчивые мысли, страх будущего, социальная тревога — когда голова не выключается." },
  { icon: "🫀", title: "Тело говорит громче слов", desc: "Головные боли, ЖКТ, нарушения сна, хроническое напряжение — когда симптомы есть, а причин не находят." },
  { icon: "🔥", title: "Выгорание и потеря смысла", desc: "Всё делаете правильно, но внутри пусто. Работа не радует, близкие раздражают." },
  { icon: "⚡", title: "Острый кризис", desc: "Развод, потеря работы, потеря близкого — нужно пройти через это, не разваливаясь." },
  { icon: "💢", title: "Эмоции и отношения", desc: "Вспышки гнева, трудности с границами, эмоциональные качели, конфликты с близкими." },
  { icon: "💼", title: "Бизнес и давление", desc: "Синдром самозванца, страх ошибки, невозможность делегировать, постоянный стресс владельца." },
];

const ProblemsSection = () => {
  return (
    <>
      <div className="glow-line mx-6 lg:mx-[60px]" />
      <section className="px-6 lg:px-[60px] py-[72px] lg:py-[100px]" id="problems">
        <Reveal className="text-center max-w-[700px] mx-auto mb-[60px]">
          <h2 className="text-[clamp(36px,4.5vw,60px)] font-extrabold tracking-tight leading-[1.1] mb-4">
            С чем <span className="text-gradient">приходят</span>
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Нет «правильного» повода обратиться к психологу. Если что-то мешает жить — этого достаточно
          </p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.map((p, i) => (
            <Reveal key={i}>
              <div className="bg-card border border-[hsl(var(--card-border))] rounded-lg p-7 transition-all duration-300 hover:border-primary/30 hover:-translate-y-1">
                <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center text-lg mb-4">
                  {p.icon}
                </div>
                <div className="text-base font-bold mb-2">{p.title}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{p.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
};

export default ProblemsSection;
