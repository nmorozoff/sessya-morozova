import Reveal from "./Reveal";

const FormSection = () => {
  return (
    <>
      <div className="glow-line mx-6 lg:mx-[60px]" />
      <section className="px-6 lg:px-[60px] py-[72px] lg:py-[100px] bg-bg2 relative overflow-hidden" id="session">
        <div className="absolute -top-[300px] -left-[200px] w-[700px] h-[700px] pointer-events-none" style={{ background: "radial-gradient(circle, hsla(18, 100%, 58%, 0.06) 0%, transparent 60%)" }} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative">
          <div>
            <Reveal>
              <h2 className="text-[clamp(40px,5vw,68px)] font-black tracking-tight leading-[1.05] mb-6">
                30 минут,<br />которые могут<br /><span className="text-gradient">всё изменить</span>
              </h2>
            </Reveal>
            <Reveal>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                Это не продажа. Это разговор — чтобы понять, подходим ли мы друг другу и с чего начать именно вам.
              </p>
            </Reveal>
            <Reveal>
              <div className="flex flex-col gap-3.5 mb-9">
                {[
                  "Расскажете, что происходит — я просто выслушаю",
                  "Определим, с чем именно вы хотите разобраться",
                  "Поймёте, как выглядит работа и каких результатов ждать",
                  "Никакого давления — только честный разговор",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3 text-[15px] text-foreground/80">
                    <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center text-xs flex-shrink-0 mt-0.5 text-primary font-bold">
                      →
                    </div>
                    {text}
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal>
              <div className="inline-flex items-center gap-4 bg-[hsla(145,63%,42%,0.08)] border border-[hsla(145,63%,42%,0.25)] rounded-xl px-6 py-4">
                <div>
                  <div className="text-xs text-muted-foreground">Стоимость первой встречи</div>
                  <div className="text-[32px] font-extrabold text-[#2ECC71]">Бесплатно</div>
                </div>
              </div>
            </Reveal>
          </div>
          <Reveal>
            <div className="bg-bg3 border border-border rounded-[20px] p-6 sm:p-10">
              <div className="text-2xl font-bold mb-1.5">Записаться на сессию</div>
              <div className="text-sm text-muted-foreground mb-7 leading-snug">
                Оставьте заявку — свяжусь в течение нескольких часов и согласуем удобное время
              </div>
              <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="text"
                  placeholder="Ваше имя"
                  className="bg-foreground/[0.04] border border-foreground/10 rounded-[10px] text-foreground px-4 py-3.5 text-sm placeholder:text-foreground/30 focus:border-primary focus:bg-primary/[0.05] focus:outline-none transition-colors"
                />
                <input
                  type="tel"
                  placeholder="Телефон или Telegram"
                  className="bg-foreground/[0.04] border border-foreground/10 rounded-[10px] text-foreground px-4 py-3.5 text-sm placeholder:text-foreground/30 focus:border-primary focus:bg-primary/[0.05] focus:outline-none transition-colors"
                />
                <textarea
                  placeholder="Коротко опишите, что вас беспокоит (необязательно)"
                  rows={3}
                  className="bg-foreground/[0.04] border border-foreground/10 rounded-[10px] text-foreground px-4 py-3.5 text-sm placeholder:text-foreground/30 focus:border-primary focus:bg-primary/[0.05] focus:outline-none transition-colors resize-none"
                />
                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground py-4 rounded-[10px] text-[15px] font-bold hover:bg-accent hover:-translate-y-0.5 transition-all mt-2"
                >
                  Записаться бесплатно →
                </button>
              </form>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default FormSection;
