import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getCanvasContext } from "@/lib/auth";
import { fetchCanvasUser } from "@/lib/canvas/client";
import { fetchAssignmentAssistantContext } from "@/lib/canvas/assignments";
import {
  answerAssignmentQuestion,
  isAssistantConfigured,
  type ChatTurn,
} from "@/lib/anthropic/assistant";
import { calculateGpa } from "@/lib/gpa";
import { getGpaPreferences } from "@/lib/gpa-preferences-db";
import { getSupabaseUser } from "@/lib/supabase/auth";
import {
  canvasUnauthorizedResponse,
  handleCanvasRouteError,
} from "@/lib/api/canvas-route";
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

    let gpaSummary = null;
    try {
      const { supabase, user: supaUser } = await getSupabaseUser();
      if (supaUser) {
        const prefs = await getGpaPreferences(supabase, supaUser.id);
        const gpa = calculateGpa(assignmentContext.grades, prefs);
        gpaSummary = {
          unweighted: gpa.unweighted,
          weighted: gpa.weighted,
          coursesIncluded: gpa.coursesIncluded,
        };
      }
    } catch {
      /* optional */
    }

    const answer = await answerAssignmentQuestion(
      { ...assignmentContext, gpaSummary },
      message,
      history
    );

    return NextResponse.json({ answer });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to get an answer";
    const isAnthropic =
      msg.includes("ANTHROPIC") || err instanceof Anthropic.APIError;
    if (isAnthropic) {
      return NextResponse.json(
        { error: "anthropic_error", message: msg },
        { status: 502 }
      );
    }
    return handleCanvasRouteError(err);
  }
}
