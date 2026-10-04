/** Каналы мгновенной записи (schema.org, UI, юридические страницы). */
export const BOOKING_CHANNELS = [
  {
    id: "whatsapp" as const,
    name: "WhatsApp",
    href: "https://wa.me/79295940514",
  },
  {
    id: "telegram" as const,
    name: "Telegram",
    href: "https://t.me/natalyamorozovaa",
  },
  {
    id: "max" as const,
    name: "MAX",
    href: "https://max.ru/u/f9LHodD0cOLMWn4dwsfNLXttuTDjJTF4cCK2MJPjCfNpeKrbfQ6RlQy3dLk",
  },
] as const;

export const DZEN_CHANNEL_URL = "https://dzen.ru/morozova_emdr";
