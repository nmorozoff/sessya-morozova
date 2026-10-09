/**
 * Плоский текст четырёх лендингов для проверки (без вёрстки).
 * node scripts/export-reels-landing-text.mjs
 */
import {
  REELS_BLOCK7_PROBA,
  REELS_BLOCK7_SESSIYA,
  REELS_BLOCK8_PROBA,
  REELS_BLOCK8_SESSIYA,
  REELS_EMDR_BULLETS,
  REELS_EMDR_DISCLAIMER,
  REELS_FINAL_PROBA,
  REELS_FINAL_SESSIYA,
  REELS_FORM_FOOTER_PROBA,
  REELS_FORM_FOOTER_SESSIYA,
  REELS_FORM_TITLE_PROBA,
  REELS_FORM_TITLE_SESSIYA,
  REELS_PROBA_FAQ,
  REELS_SESSIYA_FAQ,
  REELS_SHARED_FAQ,
  REELS_TOPIC_COPY,
  REELS_ABOUT_LEAD,
  REELS_ABOUT_QUOTE,
  REELS_ABOUT_PARAGRAPHS,
  REELS_ABOUT_CREDENTIALS,
  REELS_WORK_STEP_1,
  REELS_WORK_STEP_2,
  REELS_WORK_STEP_3_PROBA,
  REELS_WORK_STEP_3_SESSIYA,
  REELS_CTA_PROBA,
  REELS_CTA_SESSIYA,
  REELS_CTA_CAPTION,
  REELS_SUCCESS_PROBA,
  REELS_SUCCESS_SESSIYA,
  REELS_MESSENGER_INTRO,
} from "../src/data/reelsLandingTopics.ts";

const pages = [
  { path: "/probnaya-razvod/", topic: "razvod", offer: "proba" },
  { path: "/probnaya-poterya/", topic: "poterya", offer: "proba" },
  { path: "/sessiya-razvod/", topic: "razvod", offer: "sessiya" },
  { path: "/sessiya-poterya/", topic: "poterya", offer: "sessiya" },
];

function priceFooter() {
  return "Если после пробной сессии решите продолжить: сессия 90 минут, онлайн 5 000 ₽, очно в Москве 6 500 ₽.";
}

function renderPage({ path, topic, offer }) {
  const c = REELS_TOPIC_COPY[topic];
  const proba = offer === "proba";
  const lines = [];
  const add = (s) => lines.push(s);
  const blank = () => lines.push("");

  add(`========== ${path} ==========`);
  blank();
  add("## 1 Hero");
  add(c.h1);
  add(proba ? c.subtitleProba : c.subtitleSessiya);
  blank();
  add("## 2 " + c.painsTitle);
  c.pains.forEach((p) => add(`- ${p}`));
  add(c.painsClosing);
  add(`[Кнопка: ${proba ? REELS_CTA_PROBA : REELS_CTA_SESSIYA}]`);
  add(REELS_CTA_CAPTION);
  blank();
  add("## 3 " + c.block3Title);
  add(c.block3Paragraphs[0]);
  add(c.block3Paragraphs[1]);
  blank();
  add("## 4 " + c.block4Title);
  add(c.block4Text);
  REELS_EMDR_BULLETS.forEach((b) => add(`- ${b}`));
  add(REELS_EMDR_DISCLAIMER);
  add(`[Кнопка: ${proba ? REELS_CTA_PROBA : REELS_CTA_SESSIYA}]`);
  add(REELS_CTA_CAPTION);
  blank();
  add("## 5 Кто с вами будет работать");
  add(REELS_ABOUT_LEAD);
  add(`«${REELS_ABOUT_QUOTE}»`);
  REELS_ABOUT_PARAGRAPHS.forEach((p) => add(p));
  REELS_ABOUT_CREDENTIALS.forEach((p) => add(`- ${p}`));
  blank();
  add("## 6 Как это проходит");
  add(`1. ${REELS_WORK_STEP_1}`);
  add(`2. ${REELS_WORK_STEP_2}`);
  add(`3. ${proba ? REELS_WORK_STEP_3_PROBA : REELS_WORK_STEP_3_SESSIYA}`);
  add(`[Кнопка: ${proba ? REELS_CTA_PROBA : REELS_CTA_SESSIYA}]`);
  add(REELS_CTA_CAPTION);
  blank();
  add("## 7 " + (proba ? REELS_BLOCK7_PROBA.title : REELS_BLOCK7_SESSIYA.title));
  (proba ? REELS_BLOCK7_PROBA.items : REELS_BLOCK7_SESSIYA.items).forEach((i) => add(`- ${i}`));
  if (!proba) {
    add("Онлайн, 90 минут: 5 000 ₽");
    add("Очно в Москве, 90 минут: 6 500 ₽");
    add(REELS_BLOCK7_SESSIYA.priceCaption);
  }
  blank();
  const b8 = proba ? REELS_BLOCK8_PROBA : REELS_BLOCK8_SESSIYA;
  add("## 8 " + b8.title);
  add(b8.text);
  blank();
  add("## 10 Частые вопросы");
  [...c.thematicFaq, ...REELS_SHARED_FAQ, proba ? REELS_PROBA_FAQ : REELS_SESSIYA_FAQ].forEach((f) => {
    add(`В: ${f.q}`);
    add(`О: ${f.a}`);
  });
  blank();
  add("## 11 " + c.block11Title);
  add(c.block11Text);
  add(`[Кнопка: ${proba ? REELS_CTA_PROBA : REELS_CTA_SESSIYA}]`);
  add(REELS_CTA_CAPTION);
  blank();
  const fin = proba ? REELS_FINAL_PROBA : REELS_FINAL_SESSIYA;
  add("## 12 " + fin.title);
  add(fin.subtitle);
  add(proba ? REELS_FORM_TITLE_PROBA : REELS_FORM_TITLE_SESSIYA);
  add("[Форма: поля и чекбокс как на основном сайте]");
  add(proba ? REELS_FORM_FOOTER_PROBA : REELS_FORM_FOOTER_SESSIYA);
  add(REELS_MESSENGER_INTRO);
  add("Написать в WhatsApp / Telegram / MAX");
  blank();
  add("## 13");
  if (proba) add(priceFooter());
  add("Если вам сейчас очень плохо или есть мысли причинить себе вред, позвоните 112. Сессия не заменяет экстренную помощь.");
  blank();
  add("Экран после отправки:");
  add(proba ? REELS_SUCCESS_PROBA : REELS_SUCCESS_SESSIYA);
  blank();
  return lines.join("\n");
}

for (const p of pages) {
  console.log(renderPage(p));
}
