import { NextRequest, NextResponse } from "next/server";
import { validateNewPasswordPair } from "@/lib/auth/password-validation";
import { getSupabaseUser } from "@/lib/supabase/auth";

export async function POST(request: NextRequest) {
  const { supabase, user } = await getSupabaseUser();

  if (!user) {
    return NextResponse.json(
      { message: "Open the reset link from your email while signed in, or request a new link." },
      { status: 401 }
    );
  }

  let body: { newPassword?: string; confirmPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const newPassword = body.newPassword?.trim();
  const confirmPassword = body.confirmPassword?.trim();

  if (!newPassword || !confirmPassword) {
    return NextResponse.json(
      { message: "New password and confirmation are required." },
      { status: 400 }
    );
  }

  const pairError = validateNewPasswordPair(newPassword, confirmPassword);
  if (pairError) {
    return NextResponse.json({ message: pairError }, { status: 400 });
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
