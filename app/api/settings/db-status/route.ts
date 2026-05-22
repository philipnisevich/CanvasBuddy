import { NextResponse } from "next/server";
import { classifyDbError, dbSetupMessage } from "@/lib/supabase/db-errors";
import { getSupabaseUser } from "@/lib/supabase/auth";

export async function GET() {
  const { supabase, user } = await getSupabaseUser();

  if (!user) {
    return NextResponse.json(
      { ready: false, message: "Sign in required." },
      { status: 401 }
    );
  }

  const [canvasRes, gpaRes, appRes] = await Promise.all([
    supabase.from("user_canvas_credentials").select("user_id").limit(0),
    supabase.from("user_gpa_preferences").select("user_id").limit(0),
    supabase.from("user_app_preferences").select("user_id").limit(0),
  ]);

  const canvasIssue = canvasRes.error
    ? classifyDbError(canvasRes.error.message, canvasRes.error.code)
    : null;
  const gpaIssue = gpaRes.error
    ? classifyDbError(gpaRes.error.message, gpaRes.error.code)
    : null;
  const appIssue = appRes.error
    ? classifyDbError(appRes.error.message, appRes.error.code)
    : null;

  return NextResponse.json({
    ready: !canvasRes.error,
    gpaReady: !gpaRes.error,
    appReady: !appRes.error,
    issue: canvasIssue,
    gpaIssue,
    appIssue,
    message: canvasIssue ? dbSetupMessage(canvasIssue) : undefined,
    gpaMessage: gpaIssue ? dbSetupMessage(gpaIssue) : undefined,
    appMessage: appIssue ? dbSetupMessage(appIssue, "app") : undefined,
  });
}
