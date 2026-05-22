import { NextRequest, NextResponse } from "next/server";
import { getCanvasContext } from "@/lib/auth";
import { fetchDashboardData } from "@/lib/canvas/client";
import { fetchMissingPageData } from "@/lib/canvas/missing-data";
import { fetchUpcomingPageData } from "@/lib/canvas/upcoming-data";
import { getSupabaseUser } from "@/lib/supabase/auth";
import { getAppPreferences } from "@/lib/app-preferences-db";
import { DEFAULT_APP_PREFERENCES } from "@/lib/app-preferences";
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
  try {
    const { supabase, user } = await getSupabaseUser();
    if (user) {
      const prefs = await getAppPreferences(supabase, user.id);
      horizonDays = prefs.upcomingHorizonDays;
    }
  } catch {
    /* default */
  }

  try {
    const [dashboard, missing, upcoming] = await Promise.all([
      fetchDashboardData(ctx.baseUrl, ctx.accessToken, timezone),
      fetchMissingPageData(ctx.baseUrl, ctx.accessToken, timezone),
      fetchUpcomingPageData(
        ctx.baseUrl,
        ctx.accessToken,
        timezone,
        horizonDays
      ),
    ]);

    const lateCount = upcoming.upcoming.filter((a) => a.late).length;

    return NextResponse.json({
      ...dashboard,
      missingCount: missing.items.length,
      missingPreview: missing.items.slice(0, 5),
      upcomingPreview: upcoming.upcoming.slice(0, 5),
      lateCount,
      horizonDays,
    });
  } catch (err) {
    return handleCanvasRouteError(err);
  }
}
