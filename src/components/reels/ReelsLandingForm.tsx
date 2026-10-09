import { useState } from "react";
import { toast } from "sonner";
import type { ReelsOfferId, ReelsTopicId } from "@/data/reelsLandingTopics";
import { PAYMENT_URL_OFFLINE, PAYMENT_URL_ONLINE } from "@/data/reelsLandingPayment";
import { trackFormSubmit } from "@/lib/reelsLandingAnalytics";
import { buildReelsLeadMessage, getFormAttribution } from "@/lib/utm";

export type SessionFormat = "online" | "offline";

type Props = {
  id: string;
  offer: ReelsOfferId;
  topic: ReelsTopicId;
  submitLabel: string;
  showSessionFormat?: boolean;
};

const ReelsLandingForm = ({ id, offer, topic, submitLabel, showSessionFormat }: Props) => {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [preferredChannel, setPreferredChannel] = useState("");
  const [sessionFormat, setSessionFormat] = useState<SessionFormat>("online");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim() || !preferredChannel) return;

    const honeypot = new FormData(e.currentTarget).get("website");
    if (honeypot) return;

    setLoading(true);
    try {
      const attribution = getFormAttribution();
      const metaMessage = buildReelsLeadMessage({
        offer,
        topic,
        sessionFormat: showSessionFormat ? sessionFormat : undefined,
        utm_content: attribution.utm_content,
        utm_term: attribution.utm_term,
      });

      const res = await fetch("/api/send-form.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim(),
          message: metaMessage,
          preferredChannel,
          website: "",
          ...attribution,
        }),
      });

      const data = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null;
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed");
      }

      trackFormSubmit({ offer, topic });
      setSuccess(true);
    } catch {
      toast.error("Не удалось отправить заявку. Напишите в мессенджер ниже.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const paymentUrl =
      showSessionFormat && sessionFormat === "offline" ? PAYMENT_URL_OFFLINE : PAYMENT_URL_ONLINE;

    return (
      <div id={id} className="bg-bg3 border border-border rounded-2xl p-6 sm:p-8 scroll-mt-24">
        <h3 className="text-xl font-bold mb-3">Заявка принята</h3>
        {offer === "sessiya" ? (
          <>
            <p className="text-muted-foreground text-[15px] leading-relaxed mb-4">
              Следующий шаг: оплата и согласование времени.
            </p>
            {paymentUrl ? (
              <a
                href={paymentUrl}
                className="inline-flex min-h-12 items-center justify-center bg-primary text-primary-foreground px-6 py-3 rounded-[10px] font-bold text-[15px]"
                rel="noopener noreferrer"
              >
                Перейти к оплате
              </a>
            ) : (
              <p className="text-[15px] text-foreground/90">
                Я свяжусь с вами в выбранном мессенджере и помогу выбрать время.
              </p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            Отвечу в выбранном мессенджере и согласуем время знакомства.
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      id={id}
      className="bg-bg3 border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-4 scroll-mt-24"
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        placeholder="Ваше имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="bg-foreground/[0.04] border border-foreground/10 rounded-[10px] px-4 py-3.5 text-sm min-h-12 focus:border-primary focus:outline-none"
      />
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-muted-foreground">Мессенджер</span>
        <select
          value={preferredChannel}
          onChange={(e) => setPreferredChannel(e.target.value)}
          required
          className="bg-foreground/[0.04] border border-foreground/10 rounded-[10px] px-4 py-3.5 text-sm min-h-12 focus:border-primary focus:outline-none"
        >
          <option value="" disabled>Выберите</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Telegram">Telegram</option>
          <option value="MAX">MAX</option>
          <option value="Звонок">Звонок</option>
        </select>
      </label>
      <input
        type="text"
        inputMode="text"
        autoComplete="tel"
        placeholder="Телефон или @username"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        required
        className="bg-foreground/[0.04] border border-foreground/10 rounded-[10px] px-4 py-3.5 text-sm min-h-12 focus:border-primary focus:outline-none"
      />
      {showSessionFormat ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-[13px] text-muted-foreground mb-1">Формат сессии</legend>
          <label className="flex items-center gap-2 min-h-12 text-sm">
            <input
              type="radio"
              name={`format-${id}`}
              checked={sessionFormat === "online"}
              onChange={() => setSessionFormat("online")}
            />
            Онлайн, 90 минут
          </label>
          <label className="flex items-center gap-2 min-h-12 text-sm">
            <input
              type="radio"
              name={`format-${id}`}
              checked={sessionFormat === "offline"}
              onChange={() => setSessionFormat("offline")}
            />
            Очно в Москве, 90 минут
          </label>
        </fieldset>
      ) : null}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="flex items-start gap-3 text-[13px] text-muted-foreground leading-snug">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4 accent-primary"
          required
        />
        <span>
          Согласен(-на) с{" "}
          <a href="/privacy-policy/" target="_blank" rel="noopener noreferrer" className="underline">
            политикой конфиденциальности
          </a>{" "}
          и{" "}
          <a href="/offer/" target="_blank" rel="noopener noreferrer" className="underline">
            офертой
          </a>
          , даю согласие на обработку персональных данных
        </span>
      </label>
      <button
        type="submit"
        disabled={loading || !agreed}
        className="min-h-12 w-full bg-primary text-primary-foreground py-4 rounded-[10px] text-[15px] font-bold disabled:opacity-50"
      >
        {loading ? "Отправляю…" : submitLabel}
      </button>
      <p className="text-center text-[13px] text-muted-foreground">Отвечу в мессенджере, который вы выберете</p>
    </form>
  );
};

export default ReelsLandingForm;
