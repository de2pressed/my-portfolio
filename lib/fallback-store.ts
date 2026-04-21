import { seededAnalyticsEvents, seededPortfolioData } from "@/lib/seed-data";
import type {
  AnalyticsEvent,
  ExperienceEntry,
  PortfolioData,
  ProjectEntry,
  ReviewEntry,
  SettingEntry,
  SiteContentEntry,
  SkillEntry,
} from "@/lib/types";

type FallbackStore = PortfolioData & {
  analyticsEvents: AnalyticsEvent[];
};

declare global {
  var __portfolioFallbackStore__: FallbackStore | undefined;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createInitialStore(): FallbackStore {
  return {
    siteContent: deepClone(seededPortfolioData.siteContent),
    skills: deepClone(seededPortfolioData.skills),
    experience: deepClone(seededPortfolioData.experience),
    projects: deepClone(seededPortfolioData.projects),
    reviews: deepClone(seededPortfolioData.reviews),
    settings: deepClone(seededPortfolioData.settings),
    analyticsEvents: deepClone(seededAnalyticsEvents),
  };
}

export function getFallbackStore() {
  if (!global.__portfolioFallbackStore__) {
    global.__portfolioFallbackStore__ = createInitialStore();
  }

  return global.__portfolioFallbackStore__;
}

export function replaceFallbackCollection(
  key: keyof FallbackStore,
  value:
    | SiteContentEntry[]
    | SkillEntry[]
    | ExperienceEntry[]
    | ProjectEntry[]
    | ReviewEntry[]
    | SettingEntry[]
    | AnalyticsEvent[],
) {
  const store = getFallbackStore();
  store[key] = value as never;
  return store;
}
