import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

function createRouteHandlerClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
}

async function verifyEmailToken(
  supabase: ReturnType<typeof createRouteHandlerClient>,
  tokenHash: string,
  type: EmailOtpType
): Promise<boolean> {
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });
  if (!error) {
    return true;
  }

  if (type === "signup") {
    const retry = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: tokenHash,
    });
    return !retry.error;
  }

  return false;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = requestUrl.searchParams.get("next") ?? "/settings";

  const successUrl = new URL(next, requestUrl.origin).toString();
  const failUrl = new URL("/login", requestUrl.origin);
  failUrl.searchParams.set("error", "auth_callback_failed");

  try {
    const response = NextResponse.redirect(successUrl);
    const supabase = createRouteHandlerClient(request, response);

    let authOk = false;

    if (tokenHash && type) {
      authOk = await verifyEmailToken(supabase, tokenHash, type);
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      authOk = !error;
    }

    if (!authOk) {
      return NextResponse.redirect(failUrl);
    }

    return response;
  } catch {
    return NextResponse.redirect(failUrl);
  }
}
