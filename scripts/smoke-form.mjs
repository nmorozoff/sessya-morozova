#!/usr/bin/env node
/**
 * Дымовой тест формы на проде. Запускается в конце deploy:api.
 * Требует amocrm.secrets.env (INTERNAL_API_SECRET, AMO_*).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_SECRETS = resolve(
  ROOT,
  "../CRM и Онлайн запись психолога/amocrm.secrets.env",
);
const SITE =
  process.env.SMOKE_FORM_URL?.replace(/\/$/, "") ||
  "https://www.morozovanatalia.ru";

function loadEnvFile(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

function fail(msg) {
  console.error(`[smoke-form] FAIL: ${msg}`);
  console.error(`
Откат API (локально, после git checkout предыдущего коммита):
  git log -3 --oneline
  git checkout <commit> -- public/api/
  npm run deploy:api
Или выкатить только send-form.php с прошлого коммита через FTP.
`);
  process.exit(1);
}

function ok(msg) {
  console.log(`[smoke-form] OK: ${msg}`);
}

const secretsPath = process.env.AMO_SECRETS_ENV || DEFAULT_SECRETS;
if (!existsSync(secretsPath)) {
  fail(`нет secrets: ${secretsPath}`);
}
const secrets = loadEnvFile(secretsPath);
const internalSecret = secrets.INTERNAL_API_SECRET;
if (!internalSecret) {
  fail("INTERNAL_API_SECRET не задан");
}

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const smokeName = "Тест smoke (удалить)";
const contact = `+7999${String(runId).replace(/\D/g, "").slice(-7).padStart(7, "0")}`;
const message = `[smoke:${runId}] автотест deploy:api — удалить`;

const postRes = await fetch(`${SITE}/api/send-form.php`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: smokeName,
    contact,
    message,
    source: "smoke-test",
  }),
});

const postText = await postRes.text();
let postJson;
try {
  postJson = JSON.parse(postText);
} catch {
  fail(`ответ не JSON (HTTP ${postRes.status}): ${postText.slice(0, 200)}`);
}

if (!postRes.ok || !postJson.success) {
  fail(`send-form: HTTP ${postRes.status} ${postText}`);
}
if (!postJson.saved?.crm) {
  fail(`amo не сохранён: ${JSON.stringify(postJson.saved)}`);
}
if (!postJson.saved?.max) {
  fail(`MAX-уведомление не ушло: ${JSON.stringify(postJson.saved)}`);
}
ok(`заявка принята (submission_id=${postJson.submission_id ?? "?"}, amo=${postJson.amo_lead_id ?? "?"})`);

const lookupRes = await fetch(
  `${SITE}/api/lookup-submissions.php?days=1&name=${encodeURIComponent("Тест smoke")}`,
  { headers: { "X-Morozova-Internal-Secret": internalSecret } },
);
const lookup = await lookupRes.json();
const row = lookup.rows?.find((r) => r.contact === contact);
const submissionId = postJson.submission_id || row?.id;
if (!submissionId) {
  fail("не найден id заявки для очистки");
}

const delRes = await fetch(`${SITE}/api/delete-submission.php`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Morozova-Internal-Secret": internalSecret,
  },
  body: JSON.stringify({ id: submissionId }),
});
const delJson = await delRes.json();
if (!delJson.ok) {
  fail(`delete-submission: ${JSON.stringify(delJson)}`);
}
ok(`удалено из БД id=${submissionId}`);

const amoLeadId = postJson.amo_lead_id;
const subdomain = secrets.AMO_SUBDOMAIN;
const token = secrets.AMO_ACCESS_TOKEN;
async function amoDeleteLeadAndContacts(leadId) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const leadRes = await fetch(
    `https://${subdomain}.amocrm.ru/api/v4/leads/${leadId}?with=contacts`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const leadJson = leadRes.ok ? await leadRes.json() : null;
  const contactIds =
    leadJson?._embedded?.contacts?.map((c) => c.id).filter(Boolean) ?? [];

  const delLead = await fetch(`https://${subdomain}.amocrm.ru/api/v4/leads`, {
    method: "PATCH",
    headers,
    body: JSON.stringify([{ id: leadId, is_deleted: true }]),
  });
  if (delLead.status >= 200 && delLead.status < 300) {
    ok(`сделка amo ${leadId} помечена удалённой`);
  } else {
    console.warn(
      `[smoke-form] WARN: amo patch lead HTTP ${delLead.status}: ${(await delLead.text()).slice(0, 120)}`,
    );
  }
  if (contactIds.length > 0) {
    const delContacts = await fetch(
      `https://${subdomain}.amocrm.ru/api/v4/contacts`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(
          contactIds.map((id) => ({ id, is_deleted: true })),
        ),
      },
    );
    if (delContacts.status >= 200 && delContacts.status < 300) {
      ok(`контакты amo помечены удалёнными: ${contactIds.join(", ")}`);
    } else {
      console.warn(
        `[smoke-form] WARN: amo patch contacts HTTP ${delContacts.status}`,
      );
    }
  }
}

if (amoLeadId && subdomain && token) {
  await amoDeleteLeadAndContacts(amoLeadId);
} else if (subdomain && token) {
  const q = encodeURIComponent("Тест smoke");
  const search = await fetch(
    `https://${subdomain}.amocrm.ru/api/v4/leads?query=${q}&limit=3`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (search.ok) {
    const data = await search.json();
    const leads = data?._embedded?.leads ?? [];
    for (const lead of leads) {
      if (String(lead.name || "").includes("Тест smoke")) {
        await amoDeleteLeadAndContacts(lead.id);
      }
    }
  }
}

console.log(`
[smoke-form] Проверьте MAX: должно быть уведомление с текстом «[smoke:${runId}]».
`);

ok("дымовой тест завершён");
