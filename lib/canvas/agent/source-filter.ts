import type { CanvasAgentSource } from "./types";

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "to",
  "of",
  "in",
  "on",
  "at",
  "is",
  "are",
  "was",
  "your",
  "my",
  "our",
  "class",
  "course",
  "canvas",
  "item",
  "untitled",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^\w\s%-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractUrlsFromAnswer(answer: string): Set<string> {
  const found = new Set<string>();
  const markdownLinks = answer.matchAll(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/gi);
  for (const m of markdownLinks) {
    if (m[1]) found.add(m[1].toLowerCase());
  }
  const bareUrls = answer.matchAll(/https?:\/\/[^\s)\]>]+/gi);
  for (const m of bareUrls) {
    if (m[0]) found.add(m[0].toLowerCase().replace(/[.,;]+$/, ""));
  }
  return found;
}

function urlMatchesAnswer(sourceUrl: string, answer: string, linkedUrls: Set<string>): boolean {
  const urlLower = sourceUrl.toLowerCase();
  const answerLower = answer.toLowerCase();

  if (linkedUrls.has(urlLower)) return true;
  if (answerLower.includes(urlLower)) return true;

  try {
    const parsed = new URL(
      sourceUrl.startsWith("http") ? sourceUrl : `https://canvas.local${sourceUrl}`
    );
    const path = parsed.pathname.toLowerCase();
    if (path.length > 10 && answerLower.includes(path)) return true;
    const segments = path.split("/").filter(Boolean);
    const tail = segments.slice(-2).join("/");
    if (tail.length > 6 && answerLower.includes(tail)) return true;
  } catch {
    if (sourceUrl.startsWith("/") && answerLower.includes(urlLower)) return true;
  }

  return false;
}

function titleMatchesAnswer(title: string, answerNorm: string): boolean {
  const titleNorm = normalize(title);
  if (titleNorm.length < 3) return false;
  if (answerNorm.includes(titleNorm)) return true;

  const words = titleNorm
    .split(" ")
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  if (words.length === 0) return false;

  const matched = words.filter((w) => answerNorm.includes(w));
  if (words.length === 1) return matched.length === 1;
  if (words.length === 2) return matched.length >= 1;
  return matched.length / words.length >= 0.5;
}

/**
 * Keep only sources the final answer actually references (URL, title, or distinctive title words).
 */
export function filterSourcesForAnswer(
  answer: string,
  sources: CanvasAgentSource[]
): CanvasAgentSource[] {
  if (!sources.length || !answer.trim()) return [];

  const answerNorm = normalize(answer);
  const linkedUrls = extractUrlsFromAnswer(answer);
  const seen = new Set<string>();

  const matched = sources.filter((source) => {
    if (seen.has(source.url)) return false;

    const byUrl = urlMatchesAnswer(source.url, answer, linkedUrls);
    const byTitle = titleMatchesAnswer(source.title, answerNorm);

    const keep = byUrl || byTitle;
    if (keep) seen.add(source.url);
    return keep;
  });

  return matched.slice(0, 8);
}
