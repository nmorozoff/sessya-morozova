const rawSiteUrl = import.meta.env.VITE_SITE_URL ?? "https://www.morozovanatalia.ru";

/** Canonical host: always https://www.morozovanatalia.ru */
export const SITE_URL = rawSiteUrl
  .replace(/\/$/, "")
  .replace(/^http:\/\//i, "https://")
  .replace(/^https:\/\/morozovanatalia\.ru$/i, "https://www.morozovanatalia.ru");
