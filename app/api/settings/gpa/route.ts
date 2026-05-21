import { NextRequest, NextResponse } from "next/server";
import {
  getGpaPreferences,
  saveGpaPreferences,
} from "@/lib/gpa-preferences-db";
import { normalizeGpaPreferences, type GpaPreferences } from "@/lib/gpa-preferences";
import { getSupabaseUser } from "@/lib/supabase/auth";
import { classifyDbError, dbSetupMessage } from "@/lib/supabase/db-errors";

export async function GET() {
  const { supabase, user } = await getSupabaseUser();

  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "Sign in required." },
      { status: 401 }
    );
  }

  try {
    const preferences = await getGpaPreferences(supabase, user.id);
    return NextResponse.json({ preferences });
  } catch (err) {
    const rawMessage =
      err instanceof Error ? err.message : "Failed to load GPA settings.";
    const issue = classifyDbError(rawMessage);
    if (issue === "missing_table" || issue === "permission_denied") {
      return NextResponse.json(
        {
          error: issue === "missing_table" ? "db_not_setup" : "db_permission",
          message: dbSetupMessage(issue, "gpa"),
          preferences: normalizeGpaPreferences(null),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "load_failed", message: rawMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getSupabaseUser();

  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "Sign in required." },
      { status: 401 }
    );
  }

  let body: { preferences?: Partial<GpaPreferences> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request", message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const preferences = normalizeGpaPreferences(body.preferences);

  try {
    await saveGpaPreferences(supabase, user.id, preferences);
    return NextResponse.json({ ok: true, preferences });
  } catch (err) {
    const rawMessage =
      err instanceof Error ? err.message : "Failed to save GPA settings.";
    const issue = classifyDbError(rawMessage);
    if (issue === "missing_table" || issue === "permission_denied") {
      return NextResponse.json(
        {
          error: issue === "missing_table" ? "db_not_setup" : "db_permission",
          message: dbSetupMessage(issue, "gpa"),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "save_failed", message: rawMessage },
      { status: 500 }
    );
  }
}
