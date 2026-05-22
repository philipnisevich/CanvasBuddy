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
): Promise<{ ok: boolean; errorPreview: string | null; branch: string }> {
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });
  if (!error) {
    return { ok: true, errorPreview: null, branch: `verifyOtp:${type}` };
  }

  if (type === "signup") {
    const retry = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: tokenHash,
    });
    if (!retry.error) {
      return { ok: true, errorPreview: null, branch: "verifyOtp:email_fallback" };
    }
    return {
      ok: false,
      errorPreview: retry.error.message.slice(0, 120),
      branch: "verifyOtp:signup_and_email_failed",
    };
  }

  return {
    ok: false,
    errorPreview: error.message.slice(0, 120),
    branch: `verifyOtp:${type}`,
  };
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
    let authBranch = "none";
    let authErrorPreview: string | null = null;

    if (tokenHash && type) {
      const result = await verifyEmailToken(supabase, tokenHash, type);
      authOk = result.ok;
      authBranch = result.branch;
      authErrorPreview = result.errorPreview;
    } else if (code) {
      authBranch = "exchangeCode";
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      authOk = !error;
      authErrorPreview = error?.message?.slice(0, 120) ?? null;
    } else {
      authBranch = "missing_params";
      authErrorPreview = "No token_hash or code in callback URL";
    }

    // #region agent log
    fetch("http://127.0.0.1:7941/ingest/d44087b2-2238-465d-9653-4421e2f78fdc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "4f005d",
      },
      body: JSON.stringify({
        sessionId: "4f005d",
        hypothesisId: "H3,H4,H5",
        location: "app/auth/callback/route.ts:GET",
        message: "auth callback result",
        data: {
          authBranch,
          authOk,
          authErrorPreview,
          host: requestUrl.host,
          typeParam: type ?? null,
          hasTokenHash: !!tokenHash,
          hasCode: !!code,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (!authOk) {
      return NextResponse.redirect(failUrl);
    }

    return response;
  } catch (err) {
    // #region agent log
    fetch("http://127.0.0.1:7941/ingest/d44087b2-2238-465d-9653-4421e2f78fdc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "4f005d",
      },
      body: JSON.stringify({
        sessionId: "4f005d",
        hypothesisId: "H6",
        location: "app/auth/callback/route.ts:GET:catch",
        message: "auth callback exception",
        data: {
          errorPreview:
            err instanceof Error ? err.message.slice(0, 120) : "unknown",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.redirect(failUrl);
  }
}
