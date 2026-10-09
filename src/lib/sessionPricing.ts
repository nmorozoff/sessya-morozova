import { PRICING_OFFERS } from "@/lib/schema";

const online = PRICING_OFFERS.find((o) => o.name === "Онлайн-консультация");
const offline = PRICING_OFFERS.find((o) => o.name === "Очная сессия в Москве");

export const SESSION_PRICE_ONLINE_RUB = Number(online?.price ?? "5000");
export const SESSION_PRICE_OFFLINE_RUB = Number(offline?.price ?? "6500");

export function formatPriceRub(amount: number): string {
  return amount.toLocaleString("ru-RU");
}
