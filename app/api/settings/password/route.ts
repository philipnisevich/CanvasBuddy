import { NextRequest, NextResponse } from "next/server";
import { validateNewPasswordPair } from "@/lib/auth/password-validation";
import { getSupabaseUser } from "@/lib/supabase/auth";

export async function POST(request: NextRequest) {
  const { supabase, user } = await getSupabaseUser();

  if (!user?.email) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  let body: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const currentPassword = body.currentPassword?.trim();
  const newPassword = body.newPassword?.trim();
  const confirmPassword = body.confirmPassword?.trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      {
        message:
          "Current password, new password, and confirmation are required.",
      },
      { status: 400 }
    );
  }

  const pairError = validateNewPasswordPair(newPassword, confirmPassword);
  if (pairError) {
    return NextResponse.json({ message: pairError }, { status: 400 });
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { message: "New password must be different from your current password." },
      { status: 400 }
    );
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return NextResponse.json(
      { message: "Current password is incorrect." },
      { status: 401 }
    );
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return NextResponse.json(
      { message: updateError.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
