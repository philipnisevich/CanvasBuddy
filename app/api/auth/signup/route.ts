import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnvError } from "@/lib/supabase/env";

export async function POST(request: NextRequest) {
  const envError = getSupabaseEnvError();
  if (envError) {
    return NextResponse.json({ message: envError }, { status: 503 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password?.trim();

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 400 }
    );
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/settings`,
    },
  });

  if (error) {
    if (error.status === 429 || error.message.includes("rate limit")) {
      return NextResponse.json(
        {
          message:
            "Supabase has temporarily limited confirmation emails (often after several sign-up attempts). Wait about an hour, try signing in if you already created an account, or for local dev disable “Confirm email” in Supabase → Authentication → Providers → Email.",
        },
        { status: 429 }
      );
    }
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    needsEmailConfirmation: !data.session,
  });
}
