import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getCanvasContext, clearSessionOnUnauthorized } from "@/lib/auth";
import { fetchCanvasUser, CanvasApiError } from "@/lib/canvas/client";
import { fetchAssignmentAssistantContext } from "@/lib/canvas/assignments";
import {
  answerAssignmentQuestion,
  isAssistantConfigured,
} from "@/lib/anthropic/assistant";
import { getDefaultTimezone } from "@/lib/dates";

export async function POST(request: NextRequest) {
  if (!isAssistantConfigured()) {
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
  if (!ctx) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message: "Please connect with Canvas or your access token.",
      },
      { status: 401 }
    );
  }

  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const message = typeof body.message === "string" ? body.message : "";
  if (!message.trim()) {
    return NextResponse.json(
      { error: "invalid_body", message: "message is required." },
      { status: 400 }
    );
  }

  const timezone =
    request.headers.get("x-timezone")?.trim() || getDefaultTimezone();

  try {
    const user = await fetchCanvasUser(ctx.baseUrl, ctx.accessToken);
    const assignmentContext = await fetchAssignmentAssistantContext(
      ctx.baseUrl,
      ctx.accessToken,
      timezone,
      user.name
    );

    const answer = await answerAssignmentQuestion(assignmentContext, message);

    return NextResponse.json({ answer });
  } catch (err) {
    if (err instanceof CanvasApiError) {
      if (err.status === 401) {
        await clearSessionOnUnauthorized();
        return NextResponse.json(
          {
            error: "unauthorized",
            message:
              "Your Canvas session expired or was revoked. Please connect again.",
          },
          { status: 401 }
        );
      }
      if (err.status === 429) {
        return NextResponse.json(
          {
            error: "rate_limited",
            message: "Canvas is rate limiting requests. Try again in a minute.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "canvas_error", message: err.message },
        { status: err.status >= 400 ? err.status : 502 }
      );
    }

    const msg = err instanceof Error ? err.message : "Failed to get an answer";
    const isAnthropic =
      msg.includes("ANTHROPIC") || err instanceof Anthropic.APIError;

    return NextResponse.json(
      {
        error: isAnthropic ? "anthropic_error" : "server_error",
        message: msg,
      },
      { status: isAnthropic ? 502 : 500 }
    );
  }
}
