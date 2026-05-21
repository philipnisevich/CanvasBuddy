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

  const { error } = await supabase
    .from("user_canvas_credentials")
    .select("user_id")
    .limit(0);

  if (error) {
    const issue = classifyDbError(error.message, error.code);
    return NextResponse.json({
      ready: false,
      issue,
      message: dbSetupMessage(issue),
    });
  }

  return NextResponse.json({ ready: true });
}
