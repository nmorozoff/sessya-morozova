import Reveal from "./Reveal";
import aboutPhoto from "@/assets/about-photo.jpg";

const credentials = [
  "Финансовый менеджмент, ГУУ",
  "Психологическое консультирование, Институт трансперсональной психологии",
  "Психологическая работа с травматическим стрессом, ВШЭ",
  "Школа бизнес-психологов, Международный центр обучения",
  "Бизнес-тренер, ИПО · Коуч ICF",
];

const AboutSection = () => {
  return (
    <>
      <div className="glow-line mx-6 lg:mx-[60px]" />
      <section className="px-6 lg:px-[60px] py-[72px] lg:py-[100px]" id="about">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          <Reveal className="relative rounded-3xl overflow-hidden">
            <div className="absolute top-6 left-6 bg-primary text-primary-foreground text-[11px] font-bold tracking-[0.1em] uppercase px-3.5 py-1.5 rounded-full z-10">
              Психолог · Коуч ICF
            </div>
            <img src={aboutPhoto} alt="Наталья Морозова" className="w-full aspect-[3/4] object-cover object-top block" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-transparent" />
          </Reveal>
          <div>
            <Reveal>
              <div className="inline-block bg-primary/10 border border-primary/25 text-primary text-[11px] font-semibold tracking-[0.12em] uppercase px-3.5 py-1 rounded-full mb-5">
                Кто я
              </div>
            </Reveal>
            <Reveal>
              <h2 className="text-[clamp(30px,3.5vw,44px)] font-extrabold leading-[1.15] mb-6 tracking-tight">
                Наталья<br />Морозова
              </h2>
            </Reveal>
            <Reveal>
              <blockquote className="text-lg italic text-foreground/80 leading-relaxed mb-6 p-5 bg-primary/[0.06] border-l-[3px] border-primary rounded-r-xl">
                Мне не нужно объяснять, как устроен ваш мир. Я просто выслушаю — и помогу найти точки сбоя.
              </blockquote>
            </Reveal>
            <Reveal>
              <p className="text-[15px] text-muted-foreground leading-[1.75] mb-3.5">
                Я психолог, коуч ICF, предприниматель и многодетная мама. Не говорю общими фразами и не обещаю чудес. Я предлагаю пространство, где можно просто быть собой.
              </p>
            </Reveal>
            <Reveal>
              <p className="text-[15px] text-muted-foreground leading-[1.75] mb-3.5">
                Со мной безопасно — не буду осуждать. Для начала просто выслушаю. Я знаю изнутри, каково это — вывозить всё на себе, тревожиться и при этом продолжать улыбаться.
              </p>
            </Reveal>
            <Reveal>
              <p className="text-[15px] text-muted-foreground leading-[1.75] mb-3.5">
                Среди моих клиентов — предприниматели, руководители, люди в кризисе и те, кто просто чувствует: что-то не так, хотя снаружи всё нормально.
              </p>
            </Reveal>
            <Reveal>
              <div className="mt-7 flex flex-col gap-2.5">
                {credentials.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 text-[13px] text-foreground/60 leading-snug">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    {c}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutSection;
