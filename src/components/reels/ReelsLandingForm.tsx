import { useState } from "react";
import { toast } from "sonner";
import type { ReelsOfferId, ReelsTopicId } from "@/data/reelsLandingTopics";
import {
  REELS_SUCCESS_PROBA,
  REELS_SUCCESS_SESSIYA,
} from "@/data/reelsLandingTopics";
import { PAYMENT_URL_OFFLINE, PAYMENT_URL_ONLINE } from "@/data/reelsLandingPayment";
import { trackFormSubmit } from "@/lib/reelsLandingAnalytics";
import {
  formatPriceRub,
  SESSION_PRICE_OFFLINE_RUB,
  SESSION_PRICE_ONLINE_RUB,
} from "@/lib/sessionPricing";
import { buildReelsLeadMessage, getFormAttribution } from "@/lib/utm";

export type SessionFormat = "online" | "offline";

type Props = {
  id: string;
  offer: ReelsOfferId;
  topic: ReelsTopicId;
  formTitle: string;
  submitLabel: string;
  showSessionFormat?: boolean;
};

const ReelsLandingForm = ({
  id,
  offer,
  topic,
  formTitle,
  submitLabel,
  showSessionFormat,
}: Props) => {
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
    const successText = offer === "proba" ? REELS_SUCCESS_PROBA : REELS_SUCCESS_SESSIYA;

    return (
      <div id={id} className="bg-bg3 border border-border rounded-2xl p-6 sm:p-8 scroll-mt-24">
        <p className="text-[15px] text-foreground/90 leading-relaxed">{successText}</p>
        {offer === "sessiya" && paymentUrl ? (
          <a
            href={paymentUrl}
            className="inline-flex min-h-12 items-center justify-center bg-primary text-primary-foreground px-6 py-3 rounded-[10px] font-bold text-[15px] mt-4"
            rel="noopener noreferrer"
          >
            Перейти к оплате
          </a>
        ) : null}
      </div>
    );
  }

  const onlineLabel = `Онлайн, ${formatPriceRub(SESSION_PRICE_ONLINE_RUB)} ₽`;
  const offlineLabel = `Очно в Москве, ${formatPriceRub(SESSION_PRICE_OFFLINE_RUB)} ₽`;

  return (
    <form
      id={id}
      className="bg-bg3 border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-4 scroll-mt-24"
      onSubmit={handleSubmit}
    >
      <h3 className="text-xl font-bold">{formTitle}</h3>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-muted-foreground">Как вас зовут</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="bg-foreground/[0.04] border border-foreground/10 rounded-[10px] px-4 py-3.5 text-sm min-h-12 focus:border-primary focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-muted-foreground">В каком мессенджере вам ответить</span>
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

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-muted-foreground">Ваш контакт (телефон или @ник)</span>
        <input
          type="text"
          inputMode="text"
          autoComplete="tel"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          required
          className="bg-foreground/[0.04] border border-foreground/10 rounded-[10px] px-4 py-3.5 text-sm min-h-12 focus:border-primary focus:outline-none"
        />
      </label>

      {showSessionFormat ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Формат сессии</legend>
          <label className="flex items-center gap-2 min-h-12 text-sm">
            <input
              type="radio"
              name={`format-${id}`}
              checked={sessionFormat === "online"}
              onChange={() => setSessionFormat("online")}
            />
            {onlineLabel}
          </label>
          <label className="flex items-center gap-2 min-h-12 text-sm">
            <input
              type="radio"
              name={`format-${id}`}
              checked={sessionFormat === "offline"}
              onChange={() => setSessionFormat("offline")}
            />
            {offlineLabel}
          </label>
        </fieldset>
      ) : null}

      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <label className="flex items-start gap-3 cursor-pointer text-[13px] text-muted-foreground leading-snug mt-1">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border border-foreground/20 accent-primary"
          required
        />
        <span>
          Я согласен(-на) с{" "}
          <a href="/privacy-policy/" target="_blank" className="underline hover:text-foreground transition-colors">
            политикой конфиденциальности
          </a>
          , с условиями{" "}
          <a href="/offer/" target="_blank" className="underline hover:text-foreground transition-colors">
            публичной оферты
          </a>
          , даю своё{" "}
          <a href="/privacy/" target="_blank" className="underline hover:text-foreground transition-colors">
            согласие на обработку персональных данных
          </a>{" "}
          и{" "}
          <a href="/advertising-consent/" target="_blank" className="underline hover:text-foreground transition-colors">
            согласие на получение рекламной рассылки
          </a>
        </span>
      </label>

      <button
        type="submit"
        disabled={loading || !agreed}
        className="min-h-12 w-full bg-primary text-primary-foreground py-4 rounded-[10px] text-[15px] font-bold disabled:opacity-50"
      >
        {loading ? "Отправляю…" : submitLabel}
      </button>
    </form>
  );
};

export default ReelsLandingForm;
