import type { HomeLayout } from "@/lib/home-layout";

export interface AppPreferences {
  upcomingHorizonDays: number;
  homeLayout: HomeLayout | null;
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  upcomingHorizonDays: 3,
  homeLayout: null,
};

const HORIZON_MIN = 2;
const HORIZON_MAX = 14;

export function normalizeAppPreferences(
  raw: Partial<AppPreferences> | null | undefined
): AppPreferences {
  if (!raw) return { ...DEFAULT_APP_PREFERENCES };

  let days = raw.upcomingHorizonDays ?? DEFAULT_APP_PREFERENCES.upcomingHorizonDays;
  if (typeof days !== "number" || Number.isNaN(days)) {
    days = DEFAULT_APP_PREFERENCES.upcomingHorizonDays;
  }
  days = Math.round(days);
  if (days < HORIZON_MIN) days = HORIZON_MIN;
  if (days > HORIZON_MAX) days = HORIZON_MAX;

  return {
    upcomingHorizonDays: days,
    homeLayout: raw.homeLayout ?? null,
  };
}

export function normalizeHorizonDays(value: unknown): number {
  return normalizeAppPreferences({
    upcomingHorizonDays:
      typeof value === "number" ? value : DEFAULT_APP_PREFERENCES.upcomingHorizonDays,
  }).upcomingHorizonDays;
}
