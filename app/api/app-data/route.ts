import { NextRequest, NextResponse } from "next/server";
import { getCanvasContext } from "@/lib/auth";
import { fetchAppData } from "@/lib/canvas/app-data";
import { getSupabaseUser } from "@/lib/supabase/auth";
import { getAppPreferences } from "@/lib/app-preferences-db";
import { DEFAULT_APP_PREFERENCES } from "@/lib/app-preferences";
import { getGpaPreferences } from "@/lib/gpa-preferences-db";
import { DEFAULT_GPA_PREFERENCES } from "@/lib/gpa-preferences";
import {
  DEFAULT_HOME_LAYOUT,
  normalizeHomeLayout,
} from "@/lib/home-layout";
import {
  canvasUnauthorizedResponse,
  handleCanvasRouteError,
} from "@/lib/api/canvas-route";
import { getDefaultTimezone } from "@/lib/dates";

export async function GET(request: NextRequest) {
  const ctx = await getCanvasContext();
  if (!ctx) return canvasUnauthorizedResponse();

  const timezone =
    request.headers.get("x-timezone")?.trim() || getDefaultTimezone();

  let horizonDays = DEFAULT_APP_PREFERENCES.upcomingHorizonDays;
  let homeLayout = [...DEFAULT_HOME_LAYOUT];
  let layoutPersisted = false;
  let gpaPreferences = DEFAULT_GPA_PREFERENCES;

  try {
    const { supabase, user } = await getSupabaseUser();
    if (user) {
      const [prefs, gpaPrefs] = await Promise.all([
        getAppPreferences(supabase, user.id),
        getGpaPreferences(supabase, user.id),
      ]);
      horizonDays = prefs.upcomingHorizonDays;
      gpaPreferences = gpaPrefs;
      if (prefs.homeLayout?.length) {
        homeLayout = prefs.homeLayout;
        layoutPersisted = true;
      }
    }
  } catch {
    /* defaults */
  }

  try {
    const core = await fetchAppData(
      ctx.baseUrl,
      ctx.accessToken,
      timezone,
      horizonDays
    );

    return NextResponse.json({
      ...core,
      homeLayout: normalizeHomeLayout(homeLayout),
      layoutPersisted,
      gpaPreferences,
      fetchedAt: Date.now(),
    });
  } catch (err) {
    return handleCanvasRouteError(err);
  }
}
