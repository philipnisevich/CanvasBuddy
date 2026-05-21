import { NextRequest, NextResponse } from "next/server";
import { getCanvasContext, clearSessionOnUnauthorized } from "@/lib/auth";
import { fetchDashboardData, CanvasApiError } from "@/lib/canvas/client";
import { getDefaultTimezone } from "@/lib/dates";

export async function GET(request: NextRequest) {
  const ctx = await getCanvasContext();

  if (!ctx) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message: "Add your Canvas token in Settings.",
      },
      { status: 401 }
    );
  }

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
    if (err instanceof CanvasApiError) {
      if (err.status === 401) {
        await clearSessionOnUnauthorized();
        return NextResponse.json(
          {
            error: "unauthorized",
            message:
              "Your Canvas session expired or was revoked. Please connect again.",
          },
          { status: 401 }
        );
      }
      if (err.status === 429) {
        return NextResponse.json(
          {
            error: "rate_limited",
            message: "Canvas is rate limiting requests. Try again in a minute.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "canvas_error", message: err.message },
        { status: err.status >= 400 ? err.status : 502 }
      );
    }

    const message =
      err instanceof Error ? err.message : "Failed to load dashboard";
    return NextResponse.json(
      { error: "server_error", message },
      { status: 500 }
    );
  }
}
