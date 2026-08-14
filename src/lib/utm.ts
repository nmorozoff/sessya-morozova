const STORAGE_KEY = "morozova_utm_v1";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_LEN = 128;

export type StoredUtm = {
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  landing_path?: string;
  captured_at?: number;
};

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
  return { ...readFromStore(localStorage), ...readFromStore(sessionStorage) };
}

function writeStored(data: StoredUtm): void {
  const payload: StoredUtm = { ...data, captured_at: Date.now() };
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

  if (source) incoming.utm_source = source;
  if (campaign) incoming.utm_campaign = campaign;
  if (medium) incoming.utm_medium = medium;

  return incoming;
}

/** Сохраняет UTM из URL (последний клик с меткой в рамках 30 дней). */
export function captureUtmFromUrl(): void {
  if (typeof window === "undefined") return;

  const incoming = extractFromSearch(window.location.search);
  if (!incoming.utm_source && !incoming.utm_campaign && !incoming.utm_medium) {
    return;
  }

  incoming.landing_path = window.location.pathname;
  writeStored({ ...readStored(), ...incoming });
}

export function getStoredUtm(): StoredUtm {
  if (typeof window === "undefined") return {};
  const { captured_at: _capturedAt, ...utm } = readStored();
  return utm;
}
