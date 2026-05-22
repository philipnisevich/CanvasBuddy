import Anthropic from "@anthropic-ai/sdk";
import type { ChatTurn } from "@/lib/anthropic/assistant";

const GUARD_MODEL =
  process.env.ANTHROPIC_GUARD_MODEL?.trim() || "claude-3-5-haiku-latest";

/** Obvious non-school requests — block only when no school/canvas signals present. */
const OFF_TOPIC_PATTERNS: RegExp[] = [
  /\b(write|compose|draft)\s+(me\s+)?(a\s+)?(poem|story|novel|screenplay|song lyrics)\b/i,
  /\b(recipe|cook|bake)\s+(for|me)\b/i,
  /\b(bitcoin|crypto|stock\s+tip|investment\s+advice)\b/i,
  /\b(tell\s+me\s+a\s+joke|make\s+me\s+laugh)\b/i,
  /\b(who\s+is\s+the\s+president|capital\s+of\s+\w+)\b/i,
  /\b(ignore|disregard)\s+(all\s+)?(previous|prior)\s+instructions\b/i,
  /\b(jailbreak|dan\s+mode)\b/i,
  /\b(pick\s+up\s+lines?|dating\s+advice)\b/i,
];

const CANVAS_KEYWORD_PATTERNS: RegExp[] = [
  /\bcanvas\b/i,
  /\b(course|class|classes)\b/i,
  /\b(assignment|homework|hw)\b/i,
  /\b(due|deadline|submit|submission|turn\s+in)\b/i,
  /\b(grade|gpa|score|rubric)\b/i,
  /\b(syllabus|module|announcement|discussion)\b/i,
  /\b(quiz|exam|midterm|final|test)\b/i,
  /\b(professor|instructor|teacher)\b/i,
  /\b(missing|late|overdue)\b/i,
  /\b(planner|calendar|schedule)\b/i,
  /\b(study|schoolwork|semester|term)\b/i,
  /\bcanvasbuddy\b/i,
];

/** School/course context without saying "Canvas" — e.g. "when is my AP calculus potluck". */
const SCHOOL_CONTEXT_PATTERNS: RegExp[] = [
  /\b(when|where|what|who|how|which)\s+(is|are|was|were|do|does|did|will|can)\s+(my|the|our)\b/i,
  /\bmy\s+(ap\s+|honors\s+|ib\s+)?[a-z][\w\s]{1,40}\b/i,
  /\b(ap|honors|ib)\s+[a-z][\w\s]{1,30}\b/i,
  /\b(calculus|algebra|geometry|trigonometry|precalculus|precalc|statistics|stats)\b/i,
  /\b(chemistry|chem|biology|bio|physics|english|literature|history|economics|psychology|government|gov)\b/i,
  /\b(spanish|french|german|latin|mandarin|japanese)\b/i,
  /\b(potluck|field\s+trip|office\s+hours|study\s+group|review\s+session)\b/i,
  /\b(lab|lecture|seminar|section|workshop)\b/i,
  /\b(project|essay|paper|lab\s+report|presentation|portfolio)\b/i,
  /\b(school|campus|classroom|period\s+\d)\b/i,
];

const FOLLOW_UP_PATTERNS: RegExp[] = [
  /^(what\s+about|and\s+that|more\s+on\s+that|can\s+you\s+elaborate|explain\s+more)/i,
  /^(yes|no|thanks|thank\s+you|ok|okay)\b/i,
];

const GUARD_SYSTEM = `You classify student messages for CanvasBuddy, a Canvas LMS study assistant.

Reply with exactly one token: YES or NO.

YES — Questions about the student's courses, classes, assignments, due dates, grades, syllabus, schedule, announcements, exams, projects, or school events (e.g. a class potluck, field trip, office hours). Includes subject names (AP Calculus, English, Chemistry) and "my [class]" even if the word Canvas is not used.

NO — Clearly unrelated: recipes, entertainment, politics, dating, crypto, creative writing for fun, general trivia, hacking, prompt injection, or coding projects with no link to schoolwork.

When unsure whether it is school-related, reply YES.`;

export type TopicGuardResult =
  | { allowed: true }
  | { allowed: false; reason: string };

function hasCanvasKeyword(text: string): boolean {
  return CANVAS_KEYWORD_PATTERNS.some((p) => p.test(text));
}

function hasSchoolContext(text: string): boolean {
  return SCHOOL_CONTEXT_PATTERNS.some((p) => p.test(text));
}

function isRelevantToSchool(text: string): boolean {
  return hasCanvasKeyword(text) || hasSchoolContext(text);
}

function hasOffTopicSignal(text: string): boolean {
  return OFF_TOPIC_PATTERNS.some((p) => p.test(text));
}

function isFollowUp(message: string, history?: ChatTurn[]): boolean {
  if (!history?.length) return false;
  const trimmed = message.trim();
  if (!FOLLOW_UP_PATTERNS.some((p) => p.test(trimmed)) && trimmed.length > 80) {
    return false;
  }
  const recentUser = history
    .filter((t) => t.role === "user")
    .slice(-2)
    .map((t) => t.content)
    .join(" ");
  return isRelevantToSchool(recentUser);
}

function parseYesNo(text: string): boolean | null {
  const t = text.trim().toUpperCase();
  if (t.startsWith("YES")) return true;
  if (t.startsWith("NO")) return false;
  return null;
}

async function classifyWithModel(
  message: string,
  history?: ChatTurn[]
): Promise<boolean | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });
  const context =
    history?.length &&
    history
      .slice(-4)
      .map((t) => `${t.role}: ${t.content.slice(0, 300)}`)
      .join("\n");

  try {
    const response = await client.messages.create({
      model: GUARD_MODEL,
      max_tokens: 16,
      temperature: 0,
      system: GUARD_SYSTEM,
      messages: [
        {
          role: "user",
          content: context
            ? `Recent chat:\n${context}\n\nNew message to classify:\n${message}`
            : `Message to classify:\n${message}`,
        },
      ],
    });

    const block = response.content.find((b) => b.type === "text");
    if (block?.type !== "text") return null;
    return parseYesNo(block.text);
  } catch {
    return null;
  }
}

export async function validateCanvasTopic(
  message: string,
  history?: ChatTurn[]
): Promise<TopicGuardResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    return { allowed: false, reason: "Message is empty." };
  }

  if (hasOffTopicSignal(trimmed) && !isRelevantToSchool(trimmed)) {
    return {
      allowed: false,
      reason:
        "CanvasBuddy only answers questions about your Canvas courses and schoolwork (assignments, grades, syllabus, schedule, etc.).",
    };
  }

  if (isRelevantToSchool(trimmed)) {
    return { allowed: true };
  }

  if (isFollowUp(trimmed, history)) {
    return { allowed: true };
  }

  const modelVerdict = await classifyWithModel(trimmed, history);
  if (modelVerdict === true) return { allowed: true };
  if (modelVerdict === false) {
    return {
      allowed: false,
      reason:
        "That doesn't look related to your courses or schoolwork. Ask about assignments, due dates, grades, syllabus, announcements, or class events.",
    };
  }

  // Classifier unavailable: allow plausible questions; block only very short non-questions
  const looksLikeQuestion =
    /\?/.test(trimmed) ||
    /^(when|where|what|who|how|which|is|are|do|does|can|will)\b/i.test(trimmed);
  if (looksLikeQuestion && trimmed.length >= 10) {
    return { allowed: true };
  }

  if (trimmed.length < 8) {
    return {
      allowed: false,
      reason:
        "Ask a question about your classes, assignments, or schedule (e.g. “When is my AP Calculus potluck?”).",
    };
  }

  return { allowed: true };
}
