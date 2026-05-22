import { NextResponse } from "next/server";
import { clearSessionOnUnauthorized } from "@/lib/auth";
import { CanvasApiError } from "@/lib/canvas/client-core";

export function canvasUnauthorizedResponse() {
  return NextResponse.json(
    {
      error: "unauthorized",
      message: "Add your Canvas token in Settings.",
    },
    { status: 401 }
  );
}

export async function handleCanvasRouteError(err: unknown) {
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
    err instanceof Error ? err.message : "Unexpected server error";
  return NextResponse.json(
    { error: "server_error", message },
    { status: 500 }
  );
}
