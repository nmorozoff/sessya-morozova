import Reveal from "./Reveal";

const results = [
  {
    icon: "🧭",
    title: "Понимание без погружения в прошлое",
    checks: ["Поймёте, откуда берутся симптомы и состояния", "Найдём точки напряжения в вашей текущей жизни", "Без многолетнего разбора детства"],
  },
  {
    icon: "⚡",
    title: "Действия вместо бесконечного анализа",
    checks: ["Каждая встреча — конкретные шаги, не просто разговор", "План действий, который можно применить сразу", "Меньше «почувствуйте» — больше «сделайте»"],
    highlight: true,
  },
  {
    icon: "🔇",
    title: "Тревога снижается, контроль возвращается",
    checks: ["Научитесь распознавать триггеры", "Управлять состоянием в моменте", "Жизнь снова в ваших руках"],
  },
  {
    icon: "🛡",
    title: "Поддержка без давления и спешки",
    checks: ["Работаем в вашем ритме", "С уважением к вашим границам", "Без осуждения и громких обещаний"],
  },
];

const ResultsSection = () => {
  return (
    <>
      <div className="glow-line mx-6 lg:mx-[60px]" />
      <section className="px-6 lg:px-[60px] py-[72px] lg:py-[100px] bg-bg2" id="results">
        <Reveal className="text-center max-w-[700px] mx-auto mb-[60px]">
          <h2 className="text-[clamp(36px,4.5vw,60px)] font-extrabold tracking-tight leading-[1.1] mb-4">
            Что вы <span className="text-gradient">получите</span>
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Не «становитесь лучше». Становится легче — конкретно и ощутимо
          </p>
        </Reveal>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.map((r, i) => (
            <Reveal key={i}>
              <div className={`bg-bg3 border rounded-lg p-8 transition-all duration-300 hover:border-primary/30 hover:-translate-y-1 ${r.highlight ? "border-primary/40 bg-primary/[0.04]" : "border-[hsl(var(--card-border))]"}`}>
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-[22px] mb-[18px]">
                  {r.icon}
                </div>
                <div className="text-lg font-bold mb-2.5">{r.title}</div>
                <div className="flex flex-col gap-2 mt-3">
                  {r.checks.map((c, j) => (
                    <div key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-snug">
                      <span className="text-primary font-bold flex-shrink-0">✓</span>
                      {c}
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

export default ResultsSection;
