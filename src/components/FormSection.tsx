import { useState } from "react";
import { toast } from "sonner";
import { getStoredUtm } from "@/lib/utm";
import Reveal from "./Reveal";

const SuccessOverlay = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-[fadeIn_0.3s_ease]">
    <div className="bg-bg3 border border-border rounded-[24px] p-10 sm:p-14 max-w-md w-[90%] text-center shadow-2xl animate-[fadeIn_0.4s_ease]">
      <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">✨</span>
      </div>
      <h3 className="text-2xl sm:text-3xl font-black mb-3">Заявка принята!</h3>
      <p className="text-muted-foreground text-[15px] leading-relaxed mb-8">
        Спасибо за доверие. Свяжусь с вами в ближайшее время и согласуем удобное время для встречи.
      </p>
      <button
        onClick={onClose}
        className="bg-primary text-primary-foreground px-8 py-3.5 rounded-[10px] text-[15px] font-bold hover:bg-accent hover:-translate-y-0.5 transition-all"
      >
        Отлично →
      </button>
    </div>
  </div>
);

const ContactForm = () => {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [preferMessaging, setPreferMessaging] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim() || !contact.trim()) return;

    const honeypot = new FormData(e.currentTarget).get("website");
    if (honeypot) return;

    setLoading(true);
    try {
      const res = await fetch("/api/send-form.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim(),
          message: message.trim(),
          preferMessaging,
          website: "",
          ...getStoredUtm(),
        }),
      });

      const data = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null;

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to send");
      }

      setSuccess(true);
      setName("");
      setContact("");
      setMessage("");
      setPreferMessaging(false);
    } catch {
      toast.error("Не удалось отправить заявку. Попробуйте ещё раз или напишите в Telegram.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {success && <SuccessOverlay onClose={() => setSuccess(false)} />}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Ваше имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="bg-foreground/[0.04] border border-foreground/10 rounded-[10px] text-foreground px-4 py-3.5 text-sm placeholder:text-foreground/30 focus:border-primary focus:bg-primary/[0.05] focus:outline-none transition-colors"
      />
      <input
        type="text"
        inputMode="text"
        autoComplete="tel"
        placeholder="Телефон или Telegram (@username)"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        className="bg-foreground/[0.04] border border-foreground/10 rounded-[10px] text-foreground px-4 py-3.5 text-sm placeholder:text-foreground/30 focus:border-primary focus:bg-primary/[0.05] focus:outline-none transition-colors"
      />
      <textarea
        placeholder="Коротко опишите, что вас беспокоит (необязательно)"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="bg-foreground/[0.04] border border-foreground/10 rounded-[10px] text-foreground px-4 py-3.5 text-sm placeholder:text-foreground/30 focus:border-primary focus:bg-primary/[0.05] focus:outline-none transition-colors resize-none"
      />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <label className="flex items-start gap-3 cursor-pointer text-[13px] text-muted-foreground leading-snug">
        <input
          type="checkbox"
          checked={preferMessaging}
          onChange={(e) => setPreferMessaging(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border border-foreground/20 accent-primary"
        />
        <span>Предпочитаю переписку, а не звонок</span>
      </label>
      <label className="flex items-start gap-3 cursor-pointer text-[13px] text-muted-foreground leading-snug mt-1">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border border-foreground/20 accent-primary"
        />
        <span>
          Я согласен(-на) с{" "}
          <a href="/privacy-policy" target="_blank" className="underline hover:text-foreground transition-colors">политикой конфиденциальности</a>,{" "}
          с условиями{" "}
          <a href="/offer" target="_blank" className="underline hover:text-foreground transition-colors">публичной оферты</a>,{" "}
          даю своё{" "}
          <a href="/privacy" target="_blank" className="underline hover:text-foreground transition-colors">согласие на обработку персональных данных</a>{" "}
          и{" "}
          <a href="/advertising-consent" target="_blank" className="underline hover:text-foreground transition-colors">согласие на получение рекламной рассылки</a>
        </span>
      </label>
      <button
        type="submit"
        disabled={loading || !agreed}
        className="w-full bg-primary text-primary-foreground py-4 rounded-[10px] text-[15px] font-bold hover:bg-accent hover:-translate-y-0.5 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Отправляю..." : "Записаться бесплатно →"}
      </button>
    </form>
    </>
  );
};

const FormSection = () => {
  return (
    <>
      <div className="glow-line mx-6 lg:mx-[60px]" />
      <section className="px-6 lg:px-[60px] py-[72px] lg:py-[100px] bg-bg2 relative overflow-hidden" id="session">
        <div className="absolute -top-[300px] -left-[200px] w-[700px] h-[700px] pointer-events-none" style={{ background: "var(--gradient-glow)" }} />
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
            <div id="session-form" className="bg-bg3 border border-border rounded-[20px] p-6 sm:p-10">
              <div className="text-2xl font-bold mb-1.5">Записаться на сессию</div>
              <div className="text-sm text-muted-foreground mb-7 leading-snug">
                Оставьте заявку — свяжусь в течение нескольких часов и согласуем удобное время
              </div>
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default FormSection;
