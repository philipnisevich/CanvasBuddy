/**
 * Legacy single-shot assistant (pre-built Canvas snapshot).
 * Production AI uses lib/anthropic/canvas-agent.ts (tool-use agent).
 */
import Anthropic from "@anthropic-ai/sdk";
import type {
  AssignmentAssistantContext,
  GpaSummaryContext,
} from "@/lib/canvas/types";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_MESSAGE_LENGTH = 2000;
const MAX_OUTPUT_TOKENS = 1024;
const MAX_HISTORY_TURNS = 6;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

function formatGpaSummary(gpa: GpaSummaryContext | null | undefined): string {
  if (!gpa) return "(GPA preferences not loaded)";
  const parts: string[] = [];
  if (gpa.unweighted != null) {
    parts.push(`Unweighted GPA (estimate): ${gpa.unweighted.toFixed(2)}`);
  }
  if (gpa.weighted != null) {
    parts.push(`Weighted GPA (estimate): ${gpa.weighted.toFixed(2)}`);
  }
  parts.push(`Courses included: ${gpa.coursesIncluded}`);
  return parts.length ? parts.join("\n") : "(no GPA could be calculated)";
}

function formatContext(ctx: AssignmentAssistantContext): string {
  const grades = ctx.grades
    .map((g) => {
      if (g.hidden) return `- ${g.courseName}: grades hidden`;
      const score =
        g.currentScore != null ? `${g.currentScore}%` : "no score";
      const letter = g.currentGrade ? ` (${g.currentGrade})` : "";
      return `- ${g.courseName}: ${score}${letter}`;
    })
    .join("\n");

  const assignments = ctx.assignments
    .map((a) => {
      const lines = [
        `Title: ${a.title}`,
        `Course: ${a.courseName}`,
        `Type: ${a.type}`,
        `Due: ${a.dueAtFormatted}${a.dueDateYmd ? ` (${a.dueDateYmd})` : " (no due date)"}`,
        `Status: ${a.submitted ? "submitted" : a.missing ? "missing" : a.late ? "late" : "not submitted"}`,
      ];
      if (a.pointsPossible != null) {
        lines.push(`Points: ${a.pointsPossible}`);
      }
      lines.push(`Canvas link: ${a.htmlUrl}`);
      if (a.description) {
        lines.push(`Instructions (excerpt): ${a.description}`);
      }
      return lines.join("\n");
    })
    .join("\n---\n");

  return [
    `Student: ${ctx.userName}`,
    `Timezone: ${ctx.timezone}`,
    `Today (calendar): ${ctx.todayDate}`,
    `Tomorrow (calendar): ${ctx.tomorrowDate}`,
    "",
    "GPA summary (estimate from current course grades):",
    formatGpaSummary(ctx.gpaSummary),
    "",
    "Current grades:",
    grades || "(none)",
    "",
    "Assignments and quizzes (from Canvas):",
    assignments || "(none in the loaded window)",
  ].join("\n");
}

const SYSTEM_PROMPT = `You are CanvasBuddy, a helpful study assistant for a student using Canvas LMS.

You answer questions about the student's assignments, due dates, grades, GPA estimates, and how to approach work. Use ONLY the Canvas data provided in the conversation — do not invent assignments, due dates, or course names.

Guidelines:
- If asked when something is due, cite the exact due date/time from the data when available.
- If an assignment is not in the data, say you could not find it and suggest checking Canvas or rephrasing (e.g. include the course name).
- For study plans or outlines, use assignment instructions when present; otherwise give a sensible generic plan and note that full details are on Canvas.
- When comparing grades between courses, use the grade list and GPA summary; note hidden grades.
- When asked what is going on in a class, summarize upcoming/past assignments and descriptions for that course.
- Keep answers concise, friendly, and actionable. Use short paragraphs or bullet lists.
- Do not claim you can submit work, change grades, or access anything outside the provided data.
- Today and tomorrow refer to the calendar dates in the context (student's timezone).`;

export function isAssistantConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY?.trim();
}

function normalizeHistory(history: ChatTurn[] | undefined): ChatTurn[] {
  if (!history?.length) return [];
  return history
    .filter(
      (t) =>
        (t.role === "user" || t.role === "assistant") &&
        typeof t.content === "string" &&
        t.content.trim()
    )
    .slice(-MAX_HISTORY_TURNS * 2)
    .map((t) => ({
      role: t.role,
      content: t.content.trim().slice(0, MAX_MESSAGE_LENGTH),
    }));
}

export async function answerAssignmentQuestion(
  context: AssignmentAssistantContext,
  message: string,
  history?: ChatTurn[]
): Promise<string> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error("Message is required.");
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message must be at most ${MAX_MESSAGE_LENGTH} characters.`);
  }

  const client = getAnthropicClient();
  if (!client) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
  const prior = normalizeHistory(history);

  const messages: Anthropic.MessageParam[] = [
    ...prior.map((t) => ({
      role: t.role as "user" | "assistant",
      content: t.content,
    })),
    {
      role: "user",
      content: `Canvas data:\n\n${formatContext(context)}\n\n---\n\nStudent question: ${trimmed}`,
    },
  ];

  const response = await client.messages.create({
    model,
    max_tokens: MAX_OUTPUT_TOKENS,
    temperature: 0.4,
    system: SYSTEM_PROMPT,
    messages,
  });

  const block = response.content.find((b) => b.type === "text");
  const answer = block?.type === "text" ? block.text.trim() : "";
  if (!answer) {
    throw new Error("No response from the assistant.");
  }

  return answer;
}
