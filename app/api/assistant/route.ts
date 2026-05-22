import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getCanvasContext } from "@/lib/auth";
import {
  runCanvasAgent,
  isCanvasAgentConfigured,
  isCanvasAgentRateLimited,
} from "@/lib/anthropic/canvas-agent";
import { validateCanvasTopic } from "@/lib/anthropic/topic-guard";
import type { ChatTurn } from "@/lib/anthropic/assistant";
import {
  checkAssistantRateLimit,
  rateLimitHeaders,
} from "@/lib/api/assistant-rate-limit";
import { getGpaPreferences } from "@/lib/gpa-preferences-db";
import { DEFAULT_GPA_PREFERENCES } from "@/lib/gpa-preferences";
import { getSupabaseUser } from "@/lib/supabase/auth";
import {
  canvasUnauthorizedResponse,
  handleCanvasRouteError,
} from "@/lib/api/canvas-route";
import { getDefaultTimezone } from "@/lib/dates";
import { CanvasApiError } from "@/lib/canvas/client-core";

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  if (!isCanvasAgentConfigured()) {
    return NextResponse.json(
      {
        error: "not_configured",
        message:
          "The assignment assistant is not configured. Add ANTHROPIC_API_KEY to your environment.",
      },
      { status: 503 }
    );
  }

  const ctx = await getCanvasContext();
  if (!ctx) return canvasUnauthorizedResponse();

  let body: { message?: string; history?: ChatTurn[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const message = typeof body.message === "string" ? body.message : "";
  const history = Array.isArray(body.history) ? body.history : undefined;
  if (!message.trim()) {
    return NextResponse.json(
      { error: "invalid_body", message: "message is required." },
      { status: 400 }
    );
  }

  const { supabase, user: supaUser } = await getSupabaseUser();
  const rateKey = supaUser
    ? `user:${supaUser.id}`
    : `ip:${clientIp(request)}`;
  const rate = checkAssistantRateLimit(rateKey);

  if (!rate.allowed) {
    const headers = rateLimitHeaders(rate);
    if (rate.retryAfterSec) {
      headers["Retry-After"] = String(rate.retryAfterSec);
    }
    return NextResponse.json(
      {
        error: "rate_limited",
        message: `Too many questions. Try again in ${rate.retryAfterSec ?? 60} seconds.`,
      },
      { status: 429, headers }
    );
  }

  const topic = await validateCanvasTopic(message, history);
  if (!topic.allowed) {
    return NextResponse.json(
      {
        error: "off_topic",
        message: topic.reason,
      },
      { status: 400 }
    );
  }

  const timezone =
    request.headers.get("x-timezone")?.trim() || getDefaultTimezone();

  let gpaPreferences = DEFAULT_GPA_PREFERENCES;
  try {
    if (supaUser) {
      gpaPreferences = await getGpaPreferences(supabase, supaUser.id);
    }
  } catch {
    /* optional */
  }

  try {
    const { answer, sources } = await runCanvasAgent({
      baseUrl: ctx.baseUrl,
      accessToken: ctx.accessToken,
      timezone,
      message,
      history,
      gpaPreferences,
    });

    return NextResponse.json(
      { answer, sources },
      { headers: rateLimitHeaders(rate) }
    );
  } catch (err) {
    if (isCanvasAgentRateLimited(err)) {
      return NextResponse.json(
        {
          error: "rate_limited",
          message: "Canvas is rate limiting requests. Try again in a minute.",
        },
        { status: 429 }
      );
    }

    const msg = err instanceof Error ? err.message : "Failed to get an answer";
    const isAnthropic =
      msg.includes("ANTHROPIC") || err instanceof Anthropic.APIError;
    if (isAnthropic) {
      return NextResponse.json(
        { error: "anthropic_error", message: msg },
        { status: 502 }
      );
    }
    if (err instanceof CanvasApiError && err.status === 401) {
      return handleCanvasRouteError(err);
    }
    return handleCanvasRouteError(err);
  }
}
