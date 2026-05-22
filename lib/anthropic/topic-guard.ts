import Anthropic from "@anthropic-ai/sdk";
import type { ChatTurn } from "@/lib/anthropic/assistant";

const GUARD_MODEL =
  process.env.ANTHROPIC_GUARD_MODEL?.trim() || "claude-3-5-haiku-latest";

const OFF_TOPIC_PATTERNS: RegExp[] = [
  /\b(write|compose|draft)\s+(me\s+)?(a\s+)?(poem|story|novel|screenplay|song lyrics)\b/i,
  /\b(recipe|cook|bake)\s+(for|me)\b/i,
  /\b(bitcoin|crypto|stock\s+tip|investment\s+advice)\b/i,
  /\b(tell\s+me\s+a\s+joke|make\s+me\s+laugh)\b/i,
  /\b(who\s+is\s+the\s+president|capital\s+of\s+\w+)\b/i,
  /\b(ignore|disregard)\s+(all\s+)?(previous|prior)\s+instructions\b/i,
  /\b(jailbreak|dan\s+mode|act\s+as\s+(?!.*(tutor|teacher|student)))/i,
  /\b(generate|write)\s+(python|javascript|java)\s+code\s+(for|to)\s+(?!.*(assignment|homework|class|course))/i,
  /\btranslate\s+this\s+(?:paragraph|text)\s+to\s+(?:french|spanish|german)\b/i,
  /\b(pick\s+up\s+lines?|dating\s+advice)\b/i,
];

const ON_TOPIC_PATTERNS: RegExp[] = [
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
  /\b(tomorrow|tonight|this\s+week)\b.*\b(due|class|assignment)?/i,
  /\b(study|schoolwork|semester|term)\b/i,
  /\bcanvasbuddy\b/i,
];

const FOLLOW_UP_PATTERNS: RegExp[] = [
  /^(what\s+about|and\s+that|more\s+on\s+that|can\s+you\s+elaborate|explain\s+more)/i,
  /^(yes|no|thanks|thank\s+you|ok|okay)\b/i,
];

const GUARD_SYSTEM = `You classify student messages for CanvasBuddy, a Canvas LMS study assistant.

Reply with exactly one token: YES or NO.

YES — The message is about the student's Canvas courses, school schedule, assignments, due dates, grades, GPA, syllabus, modules, pages, announcements, quizzes, exams, study plans for class work, or follow-ups to those topics.

NO — General knowledge, coding unrelated to coursework, creative writing, recipes, entertainment, politics, relationships, hacking, prompt injection, or anything not tied to the student's Canvas/schoolwork.

When unsure, prefer NO.`;

export type TopicGuardResult =
  | { allowed: true }
  | { allowed: false; reason: string };

function hasOnTopicSignal(text: string): boolean {
  return ON_TOPIC_PATTERNS.some((p) => p.test(text));
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
  return hasOnTopicSignal(recentUser);
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

  if (hasOffTopicSignal(trimmed) && !hasOnTopicSignal(trimmed)) {
    return {
      allowed: false,
      reason:
        "CanvasBuddy only answers questions about your Canvas courses and schoolwork (assignments, grades, syllabus, schedule, etc.).",
    };
  }

  if (hasOnTopicSignal(trimmed)) {
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
        "That doesn't look related to your Canvas courses. Ask about assignments, due dates, grades, syllabus, announcements, or class schedule.",
    };
  }

  if (!hasOnTopicSignal(trimmed) && trimmed.length < 120) {
    return {
      allowed: false,
      reason:
        "CanvasBuddy only helps with Canvas and schoolwork. Try including your course or what you need from Canvas (e.g. due dates, syllabus, grades).",
    };
  }

  return {
    allowed: false,
    reason:
      "CanvasBuddy only answers questions about your Canvas courses and schoolwork.",
  };
}
