#!/usr/bin/env node
/**
 * E2E: ручное заполнение форм на обоих сайтах (через реальный Chromium).
 */
import puppeteer from "puppeteer";

const tests = [
  {
    site: "react",
    url:
      "https://www.morozovanatalia.ru/?utm_source=ig1&utm_medium=social&utm_campaign=cursor_manual_test#session-form",
    fill: async (page) => {
      await page.waitForSelector('input[placeholder="Ваше имя"]', { timeout: 20000 });
      await page.type('input[placeholder="Ваше имя"]', "Алина Курсор", { delay: 20 });
      await page.type(
        'input[placeholder="Телефон или Telegram (@username)"]',
        "+79990001122",
        { delay: 20 },
      );
      await page.type("#session-request", "Ручная проверка CRM с React-сайта, utm ig1", {
        delay: 10,
      });
      await page.click('form input[type="checkbox"]');
    },
    successText: "Заявка принята",
  },
  {
    site: "wordpress",
    url:
      "https://morozova-natalya.ru/?utm_source=tt2&utm_medium=social&utm_campaign=cursor_manual_test#session",
    fill: async (page) => {
      const cookieBtn = await page.$("[data-cookie-accept]");
      if (cookieBtn) await cookieBtn.click();
      await page.waitForSelector("#session-name", { timeout: 20000 });
      await page.type("#session-name", "Дарья Вордпресс", { delay: 20 });
      await page.type("#session-contact", "+79990003344", { delay: 20 });
      await page.type("#session-message", "Ручная проверка CRM с WordPress, utm tt2", {
        delay: 10,
      });
      const consent = await page.$('.session-form__consent input[type="checkbox"]');
      if (consent) await consent.click();
    },
    successText: "Заявка принята",
  },
];

async function runOne(browser, test) {
  const page = await browser.newPage();
  const result = { site: test.site, url: test.url, ok: false, error: null, utm: null };
  try {
    await page.goto(test.url, { waitUntil: "domcontentloaded", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 2500));
    result.utm = await page.evaluate(() => {
      try {
        return localStorage.getItem("morozova_utm_v1");
      } catch {
        return null;
      }
    });
    await test.fill(page);
    const submit =
      test.site === "react"
        ? await page.$('button[type="submit"]')
        : await page.$("[data-session-submit]");
    if (!submit) throw new Error("submit button not found");
    await submit.click();
    await page.waitForFunction(
      (text) => document.body.innerText.includes(text),
      { timeout: 20000 },
      test.successText,
    );
    result.ok = true;
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
  } finally {
    await page.close();
  }
  return result;
}

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const selected = only ? tests.filter((t) => t.site === only) : tests;
const results = [];
for (const test of selected) {
  results.push(await runOne(browser, test));
}
await browser.close();
console.log(JSON.stringify({ ok: results.every((r) => r.ok), results }, null, 2));
process.exit(results.every((r) => r.ok) ? 0 : 1);
