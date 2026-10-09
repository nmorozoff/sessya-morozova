const METRIKA_ID = 110044064;

type GoalParams = {
  offer: "proba" | "sessiya";
  topic: "razvod" | "poterya";
  channel?: string;
  block?: number;
};

function reachGoal(goal: string, params: GoalParams) {
  if (typeof window === "undefined") return;
  const ym = (window as Window & { ym?: (...args: unknown[]) => void }).ym;
  if (!ym) return;
  ym(METRIKA_ID, "reachGoal", goal, params);
}

export function trackCtaClick(params: GoalParams) {
  reachGoal("cta_click", params);
}

export function trackFormSubmit(params: GoalParams) {
  reachGoal("form_submit", params);
}

export function trackMessengerClick(params: GoalParams & { channel: string }) {
  reachGoal("messenger_click", params);
}

export function trackFaqOpen(params: GoalParams) {
  reachGoal("faq_open", params);
}

export function initReelsScrollGoals(params: GoalParams) {
  if (typeof window === "undefined") return () => {};

  const fired = { p50: false, p90: false };

  const onScroll = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    const ratio = window.scrollY / max;
    if (!fired.p50 && ratio >= 0.5) {
      fired.p50 = true;
      reachGoal("scroll_50", params);
    }
    if (!fired.p90 && ratio >= 0.9) {
      fired.p90 = true;
      reachGoal("scroll_90", params);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}
