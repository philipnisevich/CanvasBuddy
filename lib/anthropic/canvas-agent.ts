import Anthropic from "@anthropic-ai/sdk";
import { CanvasApiError } from "@/lib/canvas/client-core";
import {
  createExecutorState,
  executeCanvasTool,
} from "@/lib/canvas/agent/executor";
import { filterSourcesForAnswer } from "@/lib/canvas/agent/source-filter";
import { CANVAS_AGENT_TOOLS } from "@/lib/canvas/agent/tools";
import type { CanvasAgentSource } from "@/lib/canvas/agent/types";
import type { GpaSummaryContext } from "@/lib/canvas/types";
import type { GpaPreferences } from "@/lib/gpa-preferences";
import type { ChatTurn } from "@/lib/anthropic/assistant";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const MAX_MESSAGE_LENGTH = 2000;
const MAX_OUTPUT_TOKENS = 2048;
const MAX_HISTORY_TURNS = 6;
const MAX_AGENT_TURNS = Number(process.env.CANVAS_AGENT_MAX_TURNS) || 8;

const SYSTEM_PROMPT = `You are CanvasBuddy, a helpful study assistant for a student using Canvas LMS.

You have tools to search and read the student's live Canvas data (courses, syllabus, announcements, modules, pages, assignments, calendar, planner, grades). Use them to answer each question — do not guess.

Playbook:
- Start with list_active_courses when you need to know which course the student means.
- Syllabus questions: get_course_syllabus, then list_pages (search "syllabus") or get_page if needed.
- Keyword/event questions (e.g. potluck, exam 2): search_course on the right course_id first, then list_announcements or list_assignments if needed.
- Due dates tomorrow: list_planner_items with start_date and end_date set to tomorrow (yyyy-mm-dd from list_active_courses).
- Grade comparisons: get_grades_summary.

Rules:
- Use ONLY data returned by tools. If you searched and found nothing, say so clearly.
- When a specific announcement, assignment, or page supports your answer, mention its exact title (as in tool results) or paste its Canvas link so sources stay traceable.
- Cite course names, due dates, and Canvas links when tools return them.
- Today and tomorrow are in the student's timezone (shown by list_active_courses).
- Keep answers concise, friendly, and actionable. Format with Markdown (**bold**, bullet lists, short headings when useful).
- Do not claim you can submit work or change grades.
- If the student asks about topics unrelated to Canvas or their courses (recipes, general trivia, unrelated coding, etc.), politely decline and remind them you only help with Canvas schoolwork.`;

export interface CanvasAgentResult {
  answer: string;
  sources: CanvasAgentSource[];
}

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
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

function extractTextFromResponse(
  content: Anthropic.Message["content"]
): string {
  const parts: string[] = [];
  for (const block of content) {
    if (block.type === "text" && block.text.trim()) {
      parts.push(block.text.trim());
    }
  }
  return parts.join("\n\n");
}

export async function runCanvasAgent(opts: {
  baseUrl: string;
  accessToken: string;
  timezone: string;
  message: string;
  history?: ChatTurn[];
  gpaSummary?: GpaSummaryContext | null;
  gpaPreferences?: GpaPreferences | null;
}): Promise<CanvasAgentResult> {
  const trimmed = opts.message.trim();
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
  const executorState = createExecutorState(
    opts.baseUrl,
    opts.accessToken,
    opts.timezone,
    opts.gpaSummary ?? null,
    opts.gpaPreferences ?? null
  );

  const prior = normalizeHistory(opts.history);
  const messages: Anthropic.MessageParam[] = [
    ...prior.map((t) => ({
      role: t.role as "user" | "assistant",
      content: t.content,
    })),
    { role: "user", content: trimmed },
  ];

  let lastText = "";
  let sourcesFromLastToolRound: CanvasAgentSource[] = [];

  for (let turn = 0; turn < MAX_AGENT_TURNS; turn++) {
    const response = await client.messages.create({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      tools: CANVAS_AGENT_TOOLS,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      lastText = extractTextFromResponse(response.content);
      break;
    }

    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      messages.push({ role: "assistant", content: response.content });

      const sourceCountBeforeRound = executorState.sources.length;
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        const { content, isError } = await executeCanvasTool(
          executorState,
          block.name,
          block.input
        );
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content,
          is_error: isError,
        });
      }

      sourcesFromLastToolRound = executorState.sources.slice(
        sourceCountBeforeRound
      );
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    lastText = extractTextFromResponse(response.content);
    break;
  }

  if (!lastText) {
    lastText =
      "I couldn't complete a search on Canvas. Try rephrasing with a course name, or check your connection in Settings.";
  }

  let sources = filterSourcesForAnswer(lastText, sourcesFromLastToolRound);
  if (sources.length === 0) {
    sources = filterSourcesForAnswer(lastText, executorState.sources);
  }

  return {
    answer: lastText,
    sources,
  };
}

export function isCanvasAgentConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY?.trim();
}

export function isCanvasAgentRateLimited(err: unknown): boolean {
  return err instanceof CanvasApiError && err.status === 429;
}
