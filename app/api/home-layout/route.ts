import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/supabase/auth";
import { classifyDbError, dbSetupMessage } from "@/lib/supabase/db-errors";
import {
  DEFAULT_HOME_LAYOUT,
  normalizeHomeLayout,
  type HomeLayout,
} from "@/lib/home-layout";
import { getAppPreferences, saveHomeLayout } from "@/lib/app-preferences-db";

export async function GET() {
  const { supabase, user } = await getSupabaseUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const prefs = await getAppPreferences(supabase, user.id);
    const layout = prefs.homeLayout ?? [...DEFAULT_HOME_LAYOUT];
    return NextResponse.json({ layout, persisted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const issue = classifyDbError(msg);
    if (issue === "missing_table" || issue === "permission_denied") {
      return NextResponse.json({
        layout: [...DEFAULT_HOME_LAYOUT],
        persisted: false,
      });
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

  let body: { layout?: HomeLayout };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const layout = normalizeHomeLayout(body.layout);

  try {
    const saved = await saveHomeLayout(supabase, user.id, layout);
    return NextResponse.json({ layout: saved, persisted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const issue = classifyDbError(msg);
    if (issue === "missing_table" || issue === "permission_denied") {
      return NextResponse.json({
        layout,
        persisted: false,
        hint:
          issue === "missing_table"
            ? "Layout saved in this browser. To also save to your account, run migration 000_setup_all.sql in the Supabase SQL Editor (see Settings → database status)."
            : dbSetupMessage(issue, "app"),
      });
    }
    return NextResponse.json(
      { error: "server_error", message: msg },
      { status: 500 }
    );
  }
}
