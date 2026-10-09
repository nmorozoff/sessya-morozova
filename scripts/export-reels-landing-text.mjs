/**
 * Порядок блоков и тексты 4 лендингов для проверки.
 * node scripts/export-reels-landing-text.mjs
 */
import {
  REELS_BLOCK7_PROBA,
  REELS_BLOCK7_SESSIYA,
  REELS_BLOCK8_PROBA,
  REELS_BLOCK8_SESSIYA,
  REELS_BRIDGE_AFTER_BLOCK,
  REELS_BRIDGE_AFTER_BLOCK_10,
  REELS_CTA_PROBA,
  REELS_CTA_SESSIYA,
  REELS_EMDR_BULLETS,
  REELS_EMDR_DISCLAIMER,
  REELS_FINAL_PROBA,
  REELS_FINAL_SESSIYA,
  REELS_FORM_TITLE_PROBA,
  REELS_FORM_TITLE_SESSIYA,
  REELS_HERO_FOOTER_PROBA,
  REELS_HERO_FOOTER_SESSIYA,
  REELS_MESSENGER_INTRO,
  REELS_PROBA_FAQ,
  REELS_SESSIYA_FAQ,
  REELS_SHARED_FAQ,
  REELS_TOPIC_COPY,
  REELS_ABOUT_CREDENTIALS_LANDING,
  REELS_WORK_STEP_1,
  REELS_WORK_STEP_2,
  REELS_WORK_STEP_3_PROBA,
  REELS_WORK_STEP_3_SESSIYA,
} from "../src/data/reelsLandingTopics.ts";

const pages = [
  { path: "/probnaya-razvod/", topic: "razvod", offer: "proba" },
  { path: "/probnaya-poterya/", topic: "poterya", offer: "proba" },
  { path: "/sessiya-razvod/", topic: "razvod", offer: "sessiya" },
  { path: "/sessiya-poterya/", topic: "poterya", offer: "sessiya" },
];

function renderPage({ path, topic, offer }) {
  const c = REELS_TOPIC_COPY[topic];
  const proba = offer === "proba";
  const cta = proba ? REELS_CTA_PROBA : REELS_CTA_SESSIYA;
  const lines = [];
  const add = (s) => lines.push(s);
  const blank = () => lines.push("");

  add(`========== ${path} ==========`);
  add(`Порядок блоков (структура «горка»)`);
  blank();

  add("## 1 Hero");
  add(c.h1);
  add(proba ? c.subtitleProba : c.subtitleSessiya);
  if (!proba) add("[Карточки цен онлайн / очно]");
  add(`[Кнопка → #zapis, block=1] ${cta}`);
  add(proba ? REELS_HERO_FOOTER_PROBA : REELS_HERO_FOOTER_SESSIYA);
  add(`[Мостик] ${REELS_BRIDGE_AFTER_BLOCK[1]}`);
  blank();

  add("## 2 " + c.painsTitle);
  c.pains.forEach((p) => add(`- ${p}`));
  add(c.painsClosing);
  add(`[Мостик] ${REELS_BRIDGE_AFTER_BLOCK[2]}`);
  add(`[Кнопка block=2] ${cta}`);
  blank();

  add("## 3 " + c.block3Title);
  add(c.block3Paragraphs[0]);
  add(c.block3Paragraphs[1]);
  add(`[Мостик] ${REELS_BRIDGE_AFTER_BLOCK[3]}`);
  blank();

  add("## 4 " + c.block4Title);
  add(c.block4Text);
  REELS_EMDR_BULLETS.forEach((b) => add(`- ${b}`));
  add(REELS_EMDR_DISCLAIMER);
  add(`[Мостик] ${REELS_BRIDGE_AFTER_BLOCK[4]}`);
  add(`[Кнопка block=4] ${cta}`);
  blank();

  add("## 5 Кто с вами будет работать");
  add("Наталья Морозова");
  add("Психолог, EMDR-терапевт");
  REELS_ABOUT_CREDENTIALS_LANDING.forEach((x) => add(`- ${x}`));
  add(`[Мостик] ${REELS_BRIDGE_AFTER_BLOCK[5]}`);
  blank();

  add("## 6 " + (proba ? REELS_BLOCK7_PROBA.title : REELS_BLOCK7_SESSIYA.title));
  (proba ? REELS_BLOCK7_PROBA.items : REELS_BLOCK7_SESSIYA.items).forEach((i) => add(`- ${i}`));
  if (!proba) {
    add("Онлайн, 90 минут: 5 000 ₽");
    add("Очно в Москве, 90 минут: 6 500 ₽");
    add(REELS_BLOCK7_SESSIYA.priceCaption);
  }
  add(`[Мостик] ${REELS_BRIDGE_AFTER_BLOCK[6]}`);
  add(`[Кнопка block=6] ${cta}`);
  blank();

  add("## 7 Как это проходит");
  add(`1. ${REELS_WORK_STEP_1}`);
  add(`2. ${REELS_WORK_STEP_2}`);
  add(`3. ${proba ? REELS_WORK_STEP_3_PROBA : REELS_WORK_STEP_3_SESSIYA}`);
  add(`[Мостик] ${REELS_BRIDGE_AFTER_BLOCK[7]}`);
  blank();

  const b8 = proba ? REELS_BLOCK8_PROBA : REELS_BLOCK8_SESSIYA;
  add("## 8 " + b8.title);
  add(b8.text);
  add(`[Мостик] ${REELS_BRIDGE_AFTER_BLOCK[8]}`);
  blank();

  add("## 9 Частые вопросы");
  [...c.thematicFaq, ...REELS_SHARED_FAQ, proba ? REELS_PROBA_FAQ : REELS_SESSIYA_FAQ].forEach((f) => {
    add(`В: ${f.q}`);
    add(`О: ${f.a}`);
  });
  add(`[Мостик] ${REELS_BRIDGE_AFTER_BLOCK[9]}`);
  add(`[Кнопка block=9] ${cta}`);
  blank();

  add("## 10 " + c.block11Title);
  add(c.block11Text);
  add(`[Мостик] ${REELS_BRIDGE_AFTER_BLOCK_10}`);
  blank();

  const fin = proba ? REELS_FINAL_PROBA : REELS_FINAL_SESSIYA;
  add("## 11 Финал (#zapis — единственная форма)");
  add(fin.title);
  add(fin.subtitle);
  add(proba ? REELS_FORM_TITLE_PROBA : REELS_FORM_TITLE_SESSIYA);
  add("[Форма id=zapis]");
  add(REELS_MESSENGER_INTRO);
  add("Написать в WhatsApp / Telegram / MAX (только здесь)");
  if (proba) add("Если после пробной сессии решите продолжить: сессия 90 минут, онлайн 5 000 ₽, очно в Москве 6 500 ₽.");
  add("Если вам сейчас очень плохо… позвоните 112. Сессия не заменяет экстренную помощь.");
  blank();
  return lines.join("\n");
}

for (const p of pages) {
  console.log(renderPage(p));
}
