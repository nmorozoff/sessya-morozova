const STORAGE_KEY = "morozova_utm_v1";
const ENTRY_FLAG_KEY = "morozova_entry_captured_v1";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_LEN = 128;

const SITE_HOSTS = ["morozovanatalia.ru", "morozova-natalya.ru"];

export type StoredUtm = {
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_term?: string;
  landing_path?: string;
  entry_referrer?: string;
  source_inferred?: boolean;
  captured_at?: number;
};

export type FormAttribution = {
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_term?: string;
  landing_path?: string;
  referrer?: string;
};

/** In-memory fallback when WebView blocks storage (ChatGPT, in-app browsers). */
let memoryAttribution: StoredUtm | null = null;

function trimUtm(value: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, MAX_LEN);
}

function readFromStore(store: Storage): StoredUtm {
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredUtm;
    if (typeof parsed !== "object" || parsed === null) return {};
    if (parsed.captured_at && Date.now() - parsed.captured_at > TTL_MS) {
      store.removeItem(STORAGE_KEY);
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

function readStored(): StoredUtm {
  if (typeof window === "undefined") return {};
  const merged = { ...readFromStore(localStorage), ...readFromStore(sessionStorage) };
  if (memoryAttribution) {
    return { ...merged, ...memoryAttribution };
  }
  return merged;
}

function writeStored(data: StoredUtm): void {
  const payload: StoredUtm = { ...data, captured_at: Date.now() };
  memoryAttribution = { ...payload };
  const json = JSON.stringify(payload);
  try {
    sessionStorage.setItem(STORAGE_KEY, json);
  } catch {
    /* private mode / WebView */
  }
  try {
    localStorage.setItem(STORAGE_KEY, json);
  } catch {
    /* quota / blocked */
  }
}

function extractFromSearch(search: string): StoredUtm {
  const params = new URLSearchParams(search);
  const incoming: StoredUtm = {};

  const source = trimUtm(params.get("utm_source"));
  const campaign = trimUtm(params.get("utm_campaign"));
  const medium = trimUtm(params.get("utm_medium"));
  const content = trimUtm(params.get("utm_content"));
  const term = trimUtm(params.get("utm_term"));

  if (source) incoming.utm_source = source;
  if (campaign) incoming.utm_campaign = campaign;
  if (medium) incoming.utm_medium = medium;
  if (content) incoming.utm_content = content;
  if (term) incoming.utm_term = term;

  return incoming;
}

function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

export function isSameSiteReferrer(referrer: string, siteHost = "www.morozovanatalia.ru"): boolean {
  try {
    const refHost = normalizeHost(new URL(referrer).hostname);
    const hosts = new Set([
      ...SITE_HOSTS,
      normalizeHost(siteHost),
    ]);
    for (const h of hosts) {
      if (h && (refHost === h || refHost.endsWith(`.${h}`))) {
        return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}

export function inferSourceFromReferrer(referrer: string): StoredUtm & { source_inferred: true } | null {
  const ref = referrer.trim();
  if (!ref || isSameSiteReferrer(ref)) {
    return null;
  }

  let host: string;
  try {
    host = normalizeHost(new URL(ref).hostname);
  } catch {
    return null;
  }

  const rules: Array<[string, string, string]> = [
    ["chatgpt.com", "chatgpt.com", "referral"],
    ["openai.com", "chatgpt.com", "referral"],
    ["yandex.", "yandex", "organic"],
    ["ya.ru", "yandex", "organic"],
    ["google.", "google", "organic"],
    ["bing.com", "bing", "organic"],
    ["duckduckgo.com", "duckduckgo", "organic"],
    ["dzen.ru", "dzen", "referral"],
    ["vk.com", "vk", "referral"],
    ["vk.ru", "vk", "referral"],
    ["t.me", "telegram", "referral"],
    ["instagram.com", "instagram", "referral"],
    ["tiktok.com", "tiktok", "referral"],
    ["b17.ru", "b17", "referral"],
    ["facebook.com", "fb", "referral"],
    ["fb.com", "fb", "referral"],
    ["ok.ru", "ok", "referral"],
  ];

  for (const [needle, source, medium] of rules) {
    if (host === needle || host.includes(needle)) {
      return { utm_source: source, utm_medium: medium, source_inferred: true };
    }
  }

  return { utm_source: host, utm_medium: "referral", source_inferred: true };
}

function captureEntryOnce(): Partial<StoredUtm> {
  if (typeof window === "undefined") return {};
  try {
    if (sessionStorage.getItem(ENTRY_FLAG_KEY) === "1") {
      return {};
    }
    sessionStorage.setItem(ENTRY_FLAG_KEY, "1");
  } catch {
    /* continue — still set memory */
  }

  const entry: Partial<StoredUtm> = {
    landing_path: window.location.pathname || "/",
  };
  const ref = document.referrer?.trim();
  if (ref && !isSameSiteReferrer(ref)) {
    entry.entry_referrer = ref.slice(0, MAX_LEN);
  }
  return entry;
}

/**
 * Вызывать при старте приложения и при смене query (utm) в SPA.
 * Сохраняет UTM из URL, первую страницу входа и внешний referrer.
 */
export function captureVisitAttribution(): void {
  if (typeof window === "undefined") return;

  const prev = readStored();
  const entry = captureEntryOnce();
  const fromUrl = extractFromSearch(window.location.search);

  const next: StoredUtm = { ...prev, ...entry };

  if (fromUrl.utm_source || fromUrl.utm_campaign || fromUrl.utm_medium) {
    Object.assign(next, fromUrl);
    next.landing_path = window.location.pathname || "/";
    next.source_inferred = false;
  }

  if (!next.utm_source && next.entry_referrer) {
    const inferred = inferSourceFromReferrer(next.entry_referrer);
    if (inferred) {
      next.utm_source = inferred.utm_source;
      if (!next.utm_medium) next.utm_medium = inferred.utm_medium;
      next.source_inferred = true;
    }
  }

  if (
    next.utm_source ||
    next.utm_campaign ||
    next.utm_medium ||
    next.utm_content ||
    next.utm_term ||
    next.landing_path ||
    next.entry_referrer
  ) {
    writeStored(next);
  }
}

/** @deprecated use captureVisitAttribution */
export function captureUtmFromUrl(): void {
  captureVisitAttribution();
}

export function getStoredUtm(): StoredUtm {
  if (typeof window === "undefined") return {};
  const { captured_at: _capturedAt, entry_referrer: _ref, source_inferred: _si, ...utm } =
    readStored();
  return utm;
}

/** Поля для POST /api/send-form.php */
export function getFormAttribution(): FormAttribution {
  if (typeof window === "undefined") return {};

  captureVisitAttribution();

  const stored = readStored();
  let utm_source = stored.utm_source;
  let utm_medium = stored.utm_medium;
  let utm_campaign = stored.utm_campaign;

  const referrer =
    stored.entry_referrer ||
    (document.referrer?.trim() && !isSameSiteReferrer(document.referrer)
      ? document.referrer.trim().slice(0, MAX_LEN)
      : undefined);

  if (!utm_source && referrer) {
    const inferred = inferSourceFromReferrer(referrer);
    if (inferred) {
      utm_source = inferred.utm_source;
      if (!utm_medium) utm_medium = inferred.utm_medium;
    }
  }

  const landing_path =
    stored.landing_path || window.location.pathname || "/";

  return {
    utm_source,
    utm_campaign,
    utm_medium,
    utm_content: stored.utm_content,
    utm_term: stored.utm_term,
    landing_path,
    referrer,
  };
}

/** Служебные поля для лендингов рилсов — уходят в message, пока API не расширен. */
export function buildReelsLeadMessage(meta: {
  offer: string;
  topic: string;
  sessionFormat?: string;
  utm_content?: string;
  utm_term?: string;
}): string {
  const lines = [
    `[reels] offer=${meta.offer}`,
    `topic=${meta.topic}`,
  ];
  if (meta.sessionFormat) lines.push(`format=${meta.sessionFormat}`);
  if (meta.utm_content) lines.push(`utm_content=${meta.utm_content}`);
  if (meta.utm_term) lines.push(`utm_term=${meta.utm_term}`);
  return lines.join("\n");
}
