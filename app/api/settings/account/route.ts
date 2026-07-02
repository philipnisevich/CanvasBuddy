import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/supabase/auth";
import { getSupabaseServiceRoleEnvError } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";

/**
 * Permanently delete the signed-in user's account. Deleting the Supabase auth
 * user cascades to user_canvas_credentials, user_gpa_preferences, and
 * user_app_preferences (all keyed on auth.users with ON DELETE CASCADE), so
 * this removes the account, stored Canvas credentials, and preferences.
 */
export async function DELETE() {
  const { supabase, user } = await getSupabaseUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const envError = getSupabaseServiceRoleEnvError();
  if (envError) {
    return NextResponse.json({ message: envError }, { status: 500 });
  }

  const admin = createAdminClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return NextResponse.json(
      { message: `Could not delete account: ${deleteError.message}` },
      { status: 500 }
    );
  }

  // Clear both credential stores / sessions so the browser is fully logged out.
  await supabase.auth.signOut();
  const session = await getSession();
  session.destroy();

  return NextResponse.json({ ok: true });
}
