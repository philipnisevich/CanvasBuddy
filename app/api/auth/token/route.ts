import { NextRequest, NextResponse } from "next/server";
import { savePatToSession } from "@/lib/auth";
import { verifyCanvasToken, CanvasApiError } from "@/lib/canvas/client";
import { normalizeCanvasBaseUrl } from "@/lib/session";

export async function POST(request: NextRequest) {
  let body: { canvasBaseUrl?: string; accessToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request", message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const rawUrl = body.canvasBaseUrl?.trim();
  const token = body.accessToken?.trim();

  if (!rawUrl || !token) {
    return NextResponse.json(
      {
        error: "invalid_request",
        message: "Canvas URL and access token are required.",
      },
      { status: 400 }
    );
  }

  let baseUrl: string;
  try {
    baseUrl = normalizeCanvasBaseUrl(rawUrl);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid Canvas URL";
    return NextResponse.json(
      { error: "invalid_url", message },
      { status: 400 }
    );
  }

  try {
    await verifyCanvasToken(baseUrl, token);
  } catch (err) {
    if (err instanceof CanvasApiError) {
      return NextResponse.json(
        {
          error: "invalid_token",
          message:
            "Could not connect to Canvas. Check your school URL and access token.",
        },
        { status: 401 }
      );
    }
    return NextResponse.json(
      {
        error: "connection_failed",
        message:
          "Could not reach Canvas. Check your school URL and try again.",
      },
      { status: 502 }
    );
  }

  await savePatToSession(baseUrl, token);

  return NextResponse.json({ ok: true });
}
