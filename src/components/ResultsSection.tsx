import Reveal from "./Reveal";

const results = [
  {
    title: "Один эпизод — а меняется вся сеть похожих переживаний",
    checks: [
      "Работаем не с абстрактным «прошлым», а с конкретной мишенью — ключевым эпизодом, который держит симптом",
      "В памяти мишень связана с целой цепочкой похожих переживаний — прорабатывая её, снимаем нагрузку со всей цепочки, а не с одного случая",
      "Не нужно поднимать и разбирать по отдельности каждое похожее воспоминание",
    ],
  },
  {
    title: "Результат — не ощущение, а измеримый критерий",
    checks: [
      "Интенсивность тревоги по эпизоду оценивается в баллах — работа идёт, пока не дойдёт до нуля",
      "Сила нового, спокойного убеждения о себе тоже измеряется — и закрепляется на максимум",
      "Финальная проверка — сканирование тела на остаточное напряжение: если оно чистое, переработка завершена",
    ],
    highlight: true,
  },
  {
    title: "Воспоминание остаётся фактом — и перестаёт управлять вами",
    checks: [
      "Память не стирается: событие остаётся частью вашей истории, но теряет прежний эмоциональный заряд",
      "Смещается то, что называют локусом контроля — с «обстоятельства управляют мной» на «я справляюсь с этим»",
      "Тело перестаёт реагировать на триггер так, будто опасность всё ещё рядом",
    ],
  },
  {
    title: "Быстрее, чем кажется — но в вашем темпе",
    checks: [
      "По данным международных исследований, одно чётко очерченное воспоминание нередко перерабатывается уже в рамках одной сессии длительностью 60–90 минут",
      "Мы не форсируем процесс — работаем с тем объёмом материала, который вы готовы прорабатывать сегодня",
      "Свой темп важнее скорости: даже быстрый протокол не отменяет уважения к вашим границам",
    ],
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
        <p className="mt-8 text-center text-sm text-muted-foreground/80 leading-relaxed max-w-[720px] mx-auto">
          Проработка одного чётко очерченного запроса обычно занимает 2–4 сессии. Сложная или множественная травма требует больше — точный план вы получите на первой встрече.
        </p>
      </section>
    </>
  );
};

export default ResultsSection;
