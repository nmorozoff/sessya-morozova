/** Профили и карточки на внешних площадках (футер + Person.sameAs). */

export type ProfileIconId =
  | "b17"
  | "dzen"
  | "yandex-maps"
  | "google-maps"
  | "profi"
  | "yandex-uslugi"
  | "vc"
  | "tenchat"
  | "2gis"
  | "telegram-channel"
  | "max-channel";

export type ProfilePlatform = {
  /** Ключ для Яндекс.Метрики (profile_click). */
  id: string;
  name: string;
  url: string;
  icon: ProfileIconId;
};

const RAW_PROFILES: ProfilePlatform[] = [
  {
    id: "b17",
    name: "B17.ru",
    url: "https://www.b17.ru/morozova_natalia/",
    icon: "b17",
  },
  {
    id: "dzen",
    name: "Дзен",
    url: "https://dzen.ru/morozova_emdr",
    icon: "dzen",
  },
  {
    id: "yandex_maps",
    name: "Яндекс Карты",
    url: "https://yandex.ru/maps/org/psikholog_morozova_natalya_emdr_terapevt/143792456041",
    icon: "yandex-maps",
  },
  {
    id: "google_business",
    name: "Google Бизнес",
    url: "https://www.google.com/maps/search/?api=1&query=%D0%9D%D0%B0%D1%82%D0%B0%D0%BB%D1%8C%D1%8F%20%D0%9C%D0%BE%D1%80%D0%BE%D0%B7%D0%BE%D0%B2%D0%B0%20%7C%20%D0%9F%D1%81%D0%B8%D1%85%D0%BE%D0%BB%D0%BE%D0%B3&query_place_id=ChIJ0QAe9Q43tUYRTnOkPeB9XEU",
    icon: "google-maps",
  },
  {
    id: "profi",
    name: "Профи.ру",
    url: "https://profi.ru/profile/MorozovaNA127",
    icon: "profi",
  },
  {
    id: "yandex_uslugi",
    name: "Яндекс Услуги",
    url: "https://uslugi.yandex.ru/profile/MorozovaNatalya-2007512",
    icon: "yandex-uslugi",
  },
  {
    id: "vc",
    name: "VC.ru",
    url: "https://vc.ru/id6156401",
    icon: "vc",
  },
  {
    id: "tenchat",
    name: "TenChat",
    url: "https://tenchat.ru/media/5259004",
    icon: "tenchat",
  },
  {
    id: "2gis",
    name: "2ГИС",
    url: "https://2gis.ru/moscow/firm/70000001093895323",
    icon: "2gis",
  },
  {
    id: "telegram_channel",
    name: "Telegram-канал",
    url: "https://t.me/morozova_emdr",
    icon: "telegram-channel",
  },
  {
    id: "max_channel",
    name: "Канал в MAX",
    url: "https://max.ru/se13417616_biz",
    icon: "max-channel",
  },
];

/** Только площадки с непустым URL (для UI и schema). */
export function getActiveProfilePlatforms(): ProfilePlatform[] {
  return RAW_PROFILES.filter((p) => p.url.trim() !== "");
}

/** URL профилей для schema.org Person.sameAs */
export function getProfileSameAsUrls(): string[] {
  return getActiveProfilePlatforms().map((p) => p.url);
}

export const DZEN_CHANNEL_URL = "https://dzen.ru/morozova_emdr";
