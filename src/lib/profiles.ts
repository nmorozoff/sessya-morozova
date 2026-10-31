/** Профили и карточки на внешних площадках (футер + Person.sameAs). */

export type ProfilePlatform = {
  /** Ключ для Яндекс.Метрики (profile_click). */
  id: string;
  name: string;
  url: string;
  /** Локальный логотип (public/images/profile-platforms/). */
  logoSrc: string;
};

const RAW_PROFILES: ProfilePlatform[] = [
  {
    id: "b17",
    name: "B17.ru",
    url: "https://www.b17.ru/morozova_natalia/",
    logoSrc: "/images/profile-platforms/b17.png",
  },
  {
    id: "dzen",
    name: "Дзен",
    url: "https://dzen.ru/morozova_emdr",
    logoSrc: "/images/profile-platforms/dzen.png",
  },
  {
    id: "yandex_maps",
    name: "Яндекс Карты",
    url: "https://yandex.ru/maps/org/psikholog_morozova_natalya_emdr_terapevt/143792456041",
    logoSrc: "/images/profile-platforms/yandex-maps.png",
  },
  {
    id: "google_business",
    name: "Google Бизнес",
    url: "https://www.google.com/maps/search/?api=1&query=%D0%9D%D0%B0%D1%82%D0%B0%D0%BB%D1%8C%D1%8F%20%D0%9C%D0%BE%D1%80%D0%BE%D0%B7%D0%BE%D0%B2%D0%B0%20%7C%20%D0%9F%D1%81%D0%B8%D1%85%D0%BE%D0%BB%D0%BE%D0%B3&query_place_id=ChIJ0QAe9Q43tUYRTnOkPeB9XEU",
    logoSrc: "/images/profile-platforms/google-maps.svg",
  },
  {
    id: "profi",
    name: "Профи.ру",
    url: "https://profi.ru/profile/MorozovaNA127",
    logoSrc: "/images/profile-platforms/profi.png",
  },
  {
    id: "yandex_uslugi",
    name: "Яндекс Услуги",
    url: "https://uslugi.yandex.ru/profile/MorozovaNatalya-2007512",
    logoSrc: "/images/profile-platforms/yandex-uslugi.png",
  },
  {
    id: "vc",
    name: "VC.ru",
    url: "https://vc.ru/id6156401",
    logoSrc: "/images/profile-platforms/vc.png",
  },
  {
    id: "tenchat",
    name: "TenChat",
    url: "https://tenchat.ru/media/5259004",
    logoSrc: "/images/profile-platforms/tenchat.png",
  },
  {
    id: "2gis",
    name: "2ГИС",
    url: "https://2gis.ru/moscow/firm/70000001093895323",
    logoSrc: "/images/profile-platforms/gis2.png",
  },
  {
    id: "telegram_channel",
    name: "Telegram-канал",
    url: "https://t.me/morozova_emdr",
    logoSrc: "/images/profile-platforms/telegram.png",
  },
  {
    id: "max_channel",
    name: "Канал в MAX",
    url: "https://max.ru/se13417616_biz",
    logoSrc: "/images/profile-platforms/max-channel.svg",
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
