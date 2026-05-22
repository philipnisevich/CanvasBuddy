import { NextRequest, NextResponse } from "next/server";
import { getCanvasContext } from "@/lib/auth";
import { fetchDashboardData } from "@/lib/canvas/client";
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

  try {
    const data = await fetchDashboardData(
      ctx.baseUrl,
      ctx.accessToken,
      timezone
    );
    return NextResponse.json(data);
  } catch (err) {
    return handleCanvasRouteError(err);
  }
}
