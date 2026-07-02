const rawSiteUrl = import.meta.env.VITE_SITE_URL ?? "https://www.morozovanatalia.ru";

export const SITE_URL = rawSiteUrl.replace(/\/$/, "");
