const METRIKA_ID = 110044064;

export function trackProfileClick(platform: string) {
  if (typeof window === "undefined") return;
  const ym = (window as Window & { ym?: (...args: unknown[]) => void }).ym;
  if (!ym) return;
  ym(METRIKA_ID, "reachGoal", "profile_click", { platform });
}
