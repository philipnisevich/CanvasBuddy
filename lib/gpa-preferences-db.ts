import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeGpaPreferences,
  type GpaPreferences,
} from "@/lib/gpa-preferences";

export async function getGpaPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<GpaPreferences> {
  const { data, error } = await supabase
    .from("user_gpa_preferences")
    .select("preferences")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.preferences) {
    return normalizeGpaPreferences(null);
  }

  return normalizeGpaPreferences(
    data.preferences as Partial<GpaPreferences>
  );
}

export async function saveGpaPreferences(
  supabase: SupabaseClient,
  userId: string,
  preferences: GpaPreferences
): Promise<void> {
  const normalized = normalizeGpaPreferences(preferences);

  const { error } = await supabase.from("user_gpa_preferences").upsert(
    {
      user_id: userId,
      preferences: normalized,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}
