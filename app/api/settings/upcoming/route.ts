import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/supabase/auth";
import { classifyDbError, dbSetupMessage } from "@/lib/supabase/db-errors";
import { normalizeHorizonDays } from "@/lib/app-preferences";
import {
  getAppPreferences,
  saveAppPreferences,
} from "@/lib/app-preferences-db";

export async function GET() {
  const { supabase, user } = await getSupabaseUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const prefs = await getAppPreferences(supabase, user.id);
    return NextResponse.json({ horizonDays: prefs.upcomingHorizonDays });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const issue = classifyDbError(msg);
    if (issue === "missing_table" || issue === "permission_denied") {
      return NextResponse.json(
        {
          error: issue === "missing_table" ? "db_not_setup" : "db_permission",
          message: dbSetupMessage(issue, "app"),
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "server_error", message: msg },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { supabase, user } = await getSupabaseUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { horizonDays?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const horizonDays = normalizeHorizonDays(body.horizonDays);

  try {
    const prefs = await saveAppPreferences(supabase, user.id, {
      upcomingHorizonDays: horizonDays,
    });
    return NextResponse.json({ horizonDays: prefs.upcomingHorizonDays });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const issue = classifyDbError(msg);
    if (issue === "missing_table" || issue === "permission_denied") {
      return NextResponse.json(
        {
          error: issue === "missing_table" ? "db_not_setup" : "db_permission",
          message: dbSetupMessage(issue, "app"),
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "server_error", message: msg },
      { status: 500 }
    );
  }
}
