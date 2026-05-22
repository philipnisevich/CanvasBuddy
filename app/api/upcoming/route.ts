import { NextRequest, NextResponse } from "next/server";
import { getCanvasContext } from "@/lib/auth";
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
    /* use default */
  }

  const horizonParam = request.nextUrl.searchParams.get("horizonDays");
  if (horizonParam) {
    const parsed = Number.parseInt(horizonParam, 10);
    if (!Number.isNaN(parsed)) horizonDays = parsed;
  }

  try {
    const data = await fetchUpcomingPageData(
      ctx.baseUrl,
      ctx.accessToken,
      timezone,
      horizonDays
    );
    return NextResponse.json(data);
  } catch (err) {
    return handleCanvasRouteError(err);
  }
}
