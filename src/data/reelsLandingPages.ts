import type { ReelsOfferId, ReelsTopicId } from "@/data/reelsLandingTopics";

export type ReelsLandingPageConfig = {
  path: string;
  topic: ReelsTopicId;
  offer: ReelsOfferId;
};

export const REELS_LANDING_PAGES: ReelsLandingPageConfig[] = [
  { path: "/probnaya-razvod/", topic: "razvod", offer: "proba" },
  { path: "/probnaya-poterya/", topic: "poterya", offer: "proba" },
  { path: "/sessiya-razvod/", topic: "razvod", offer: "sessiya" },
  { path: "/sessiya-poterya/", topic: "poterya", offer: "sessiya" },
];

export const REELS_LANDING_PATHS = REELS_LANDING_PAGES.map((p) => p.path);

export function getReelsLandingByPath(path: string): ReelsLandingPageConfig | undefined {
  const normalized = path.endsWith("/") ? path : `${path}/`;
  return REELS_LANDING_PAGES.find((p) => p.path === normalized);
}
