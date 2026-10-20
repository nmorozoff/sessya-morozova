import type { ReelsLandingPageConfig } from "@/data/reelsLandingPages";
import type { FaqItem, ReelsOfferId, ReelsTopicId } from "@/data/reelsLandingTopics";
import {
  REELS_BLOCK7_PROBA,
  REELS_BLOCK7_SESSIYA,
  REELS_CTA_SESSIYA,
  REELS_EMDR_BULLETS,
  REELS_EMDR_DISCLAIMER,
  REELS_FINAL_PROBA,
  REELS_FINAL_SESSIYA,
  REELS_FORM_TITLE_SESSIYA,
  REELS_PROBA_FAQ,
  REELS_SESSIYA_FAQ,
  REELS_SHARED_FAQ,
  REELS_TOPIC_COPY,
} from "@/data/reelsLandingTopics";

export const REELS_CTA_PROBA_FREE = "Записаться на бесплатную 30 минутную пробную сессию";

const RAZVOD_PAIN_PARENTS =
  "Что скажут родители и знакомые? Неудобно рассказывать, а держать в себе нет сил.";

const RAZVOD_BLOCK4_PROBA =
  "EMDR (ДПДГ) это метод психотерапии для работы с тяжёлыми переживаниями. На сессии вы вспоминаете сложный момент в безопасном темпе, а я помогаю мозгу переработать его движениями глаз, чтобы он перестал вызывать прежнюю боль. Метод рекомендован Всемирной организацией здравоохранения для работы с последствиями психотравмы.";

const EMDR_BULLET_3_PROBA_RAZVOD =
  "Мы идём в вашем темпе и можем остановиться в любой момент. Результат у разных людей разный, заранее его никто гарантировать не может, часто хватает одной сессии.";

const PROBA_FAQ_TRUST: FaqItem = {
  q: "Почему пробная сессия бесплатная, в чём подвох?",
  a: "Это 30 минут, чтобы вы поняли, подходит ли вам такая работа и доверяете ли вы мне. Подвоха нет: если решите продолжить, стоимость указана внизу страницы.",
};

const SESSIYA_BLOCK7_RAZVOD = [
  "90 минут работы один на один.",
  "Разбор вашей ситуации и запроса.",
  "Первые шаги переработки с переживанием, которое сейчас вас держит.",
  "Понятный план: что делать дальше.",
  "Обучение техникам самопомощи.",
];

const MEETINGS_FAQ_EXTRA_POTERYA_PROBA =
  "Это индивидуально. Срок заранее не обещаю: обсудим после первой встречи, когда станет понятнее ваш запрос. После первой сессии становится ощутимо легче.";

const MEETINGS_FAQ_EXTRA_SESSIYA_RAZVOD =
  "Это индивидуально. Срок заранее не обещаю: обсудим после первой встречи, когда станет понятнее ваш запрос. В большинстве случаев после первой встречи становится ощутимо легче.";

function sharedFaqFor(path: string): FaqItem[] {
  const base = REELS_SHARED_FAQ.map((item) => ({ ...item }));
  const meetings = base.find((i) => i.q === "Сколько встреч потребуется?");
  if (!meetings) return base;

  if (path === "/probnaya-poterya/") {
    meetings.a = MEETINGS_FAQ_EXTRA_POTERYA_PROBA;
  } else if (path === "/sessiya-razvod/") {
    meetings.a = MEETINGS_FAQ_EXTRA_SESSIYA_RAZVOD;
  }

  return base;
}

function ctaLabelsForPath(_path: string, offer: ReelsOfferId): Record<number, string> {
  const sessiya = REELS_CTA_SESSIYA;

  if (offer === "sessiya") {
    return { 1: sessiya, 2: sessiya, 4: sessiya, 6: sessiya, 9: sessiya };
  }

  const probaCta = REELS_CTA_PROBA_FREE;
  return { 1: probaCta, 2: probaCta, 4: probaCta, 6: probaCta, 9: probaCta };
}

export type ResolvedReelsLanding = {
  topic: ReelsTopicId;
  offer: ReelsOfferId;
  path: string;
  h1: string;
  subtitle: string;
  painsTitle: string;
  pains: string[];
  painsClosing: string;
  block3Title: string;
  block3Paragraphs: [string, string];
  block4Title: string;
  block4Text: string;
  emdrBullets: string[];
  emdrDisclaimer: string | null;
  block7Title: string;
  block7Items: readonly string[];
  block7PriceCaption: string;
  thematicFaq: FaqItem[];
  sharedFaq: FaqItem[];
  offerFaq: FaqItem;
  block11Title: string;
  block11Text: string;
  finalTitle: string;
  finalSubtitle: string;
  ctaByBlock: Record<number, string>;
  stickyCta: string;
  formTitle: string;
  formSubmitLabel: string;
};

export function resolveReelsLanding(config: ReelsLandingPageConfig): ResolvedReelsLanding {
  const { path, topic, offer } = config;
  const copy = REELS_TOPIC_COPY[topic];
  const isProba = offer === "proba";

  let pains = [...copy.pains];
  if (path === "/probnaya-razvod/") {
    pains[6] = RAZVOD_PAIN_PARENTS;
  }

  let subtitle = isProba ? copy.subtitleProba : copy.subtitleSessiya;
  if (path === "/probnaya-poterya/") {
    subtitle =
      "Бесплатная пробная сессия 30 минут онлайн с психологом, EMDR-терапевтом. Разберём, что с вами происходит и подойдёт ли вам такая работа.";
  }

  let block4Text = copy.block4Text;
  if (path === "/probnaya-razvod/") {
    block4Text = RAZVOD_BLOCK4_PROBA;
  }

  let emdrBullets = [...REELS_EMDR_BULLETS];
  let emdrDisclaimer: string | null = REELS_EMDR_DISCLAIMER;
  if (path === "/probnaya-razvod/") {
    emdrBullets[2] = EMDR_BULLET_3_PROBA_RAZVOD;
    emdrDisclaimer = null;
  }

  let block7Items: readonly string[] = isProba
    ? REELS_BLOCK7_PROBA.items
    : path === "/sessiya-razvod/"
      ? SESSIYA_BLOCK7_RAZVOD
      : REELS_BLOCK7_SESSIYA.items;

  const ctaByBlock = ctaLabelsForPath(path, offer);
  const stickyCta = isProba ? REELS_CTA_PROBA_FREE : REELS_CTA_SESSIYA;
  const formTitle = isProba ? REELS_CTA_PROBA_FREE : REELS_FORM_TITLE_SESSIYA;
  const formSubmitLabel = formTitle;

  let finalSubtitle = isProba ? REELS_FINAL_PROBA.subtitle : REELS_FINAL_SESSIYA.subtitle;
  if (path === "/probnaya-razvod/") {
    finalSubtitle = "Запишитесь на бесплатную пробную сессию, это займёт минуту.";
  }

  const offerFaq = isProba ? PROBA_FAQ_TRUST : REELS_SESSIYA_FAQ;

  return {
    topic,
    offer,
    path,
    h1: copy.h1,
    subtitle,
    painsTitle: copy.painsTitle,
    pains,
    painsClosing: copy.painsClosing,
    block3Title: copy.block3Title,
    block3Paragraphs: copy.block3Paragraphs,
    block4Title: copy.block4Title,
    block4Text,
    emdrBullets,
    emdrDisclaimer,
    block7Title: isProba ? REELS_BLOCK7_PROBA.title : REELS_BLOCK7_SESSIYA.title,
    block7Items,
    block7PriceCaption: REELS_BLOCK7_SESSIYA.priceCaption,
    thematicFaq: copy.thematicFaq,
    sharedFaq: sharedFaqFor(path),
    offerFaq,
    block11Title: copy.block11Title,
    block11Text: copy.block11Text,
    finalTitle: isProba ? REELS_FINAL_PROBA.title : REELS_FINAL_SESSIYA.title,
    finalSubtitle,
    ctaByBlock,
    stickyCta,
    formTitle,
    formSubmitLabel,
  };
}

export function faqListFor(resolved: ResolvedReelsLanding): FaqItem[] {
  return [...resolved.thematicFaq, ...resolved.sharedFaq, resolved.offerFaq];
}
