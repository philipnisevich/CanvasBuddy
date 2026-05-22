import type { SupabaseClient } from "@supabase/supabase-js";
import { classifyDbError } from "@/lib/supabase/db-errors";
import {
  DEFAULT_APP_PREFERENCES,
  normalizeAppPreferences,
  type AppPreferences,
} from "@/lib/app-preferences";
import { normalizeHomeLayout, type HomeLayout } from "@/lib/home-layout";

export async function getAppPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<AppPreferences> {
  const { data, error } = await supabase
    .from("user_app_preferences")
    .select("preferences")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    const issue = classifyDbError(error.message, error.code);
    if (issue === "missing_table" || issue === "permission_denied") {
      return { ...DEFAULT_APP_PREFERENCES };
    }
    throw new Error(error.message);
  }

  if (!data?.preferences) {
    return { ...DEFAULT_APP_PREFERENCES };
  }

  const raw = data.preferences as Record<string, unknown>;
  return normalizeAppPreferences({
    upcomingHorizonDays: raw.upcomingHorizonDays as number | undefined,
    homeLayout: raw.homeLayout
      ? normalizeHomeLayout(raw.homeLayout)
      : null,
  });
}

export async function saveAppPreferences(
  supabase: SupabaseClient,
  userId: string,
  patch: Partial<AppPreferences>
): Promise<AppPreferences> {
  const current = await getAppPreferences(supabase, userId);
  const merged = normalizeAppPreferences({ ...current, ...patch });

  const { error } = await supabase.from("user_app_preferences").upsert(
    {
      user_id: userId,
      preferences: {
        upcomingHorizonDays: merged.upcomingHorizonDays,
        homeLayout: merged.homeLayout,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  return merged;
}

export async function saveHomeLayout(
  supabase: SupabaseClient,
  userId: string,
  homeLayout: HomeLayout
): Promise<HomeLayout> {
  const merged = await saveAppPreferences(supabase, userId, {
    homeLayout: normalizeHomeLayout(homeLayout),
  });
  return merged.homeLayout ?? normalizeHomeLayout(null);
}
