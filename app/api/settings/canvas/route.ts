import { NextRequest, NextResponse } from "next/server";
import { savePatToSession } from "@/lib/auth";
import {
  deleteCanvasCredentials,
  getCanvasCredentials,
} from "@/lib/canvas-credentials";
import { verifyCanvasToken, CanvasApiError } from "@/lib/canvas/client";
import { getSupabaseUser } from "@/lib/supabase/auth";
import { normalizeCanvasBaseUrl, getSession } from "@/lib/session";
import { classifyDbError, dbSetupMessage } from "@/lib/supabase/db-errors";

export async function GET() {
  const { supabase, user } = await getSupabaseUser();

  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "Sign in required." },
      { status: 401 }
    );
  }

  const creds = await getCanvasCredentials(supabase, user.id);

  return NextResponse.json({
    hasCredentials: !!creds,
    canvasBaseUrl: creds?.canvas_base_url ?? null,
  });
}

export async function POST(request: NextRequest) {
  const { user } = await getSupabaseUser();

  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "Sign in required." },
      { status: 401 }
    );
  }

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

  try {
    await savePatToSession(baseUrl, token);
  } catch (err) {
    const rawMessage =
      err instanceof Error ? err.message : "Failed to save credentials.";
    const issue = classifyDbError(rawMessage);
    if (issue === "missing_table" || issue === "permission_denied") {
      return NextResponse.json(
        {
          error: issue === "missing_table" ? "db_not_setup" : "db_permission",
          message: dbSetupMessage(issue),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "save_failed", message: rawMessage },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, canvasBaseUrl: baseUrl });
}

export async function DELETE() {
  const { supabase, user } = await getSupabaseUser();

  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "Sign in required." },
      { status: 401 }
    );
  }

  await deleteCanvasCredentials(supabase, user.id);

  const session = await getSession();
  session.destroy();

  return NextResponse.json({ ok: true });
}
