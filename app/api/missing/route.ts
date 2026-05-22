import { NextRequest, NextResponse } from "next/server";
import { getCanvasContext } from "@/lib/auth";
import { fetchMissingPageData } from "@/lib/canvas/missing-data";
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
    const data = await fetchMissingPageData(
      ctx.baseUrl,
      ctx.accessToken,
      timezone
    );
    return NextResponse.json(data);
  } catch (err) {
    return handleCanvasRouteError(err);
  }
}
