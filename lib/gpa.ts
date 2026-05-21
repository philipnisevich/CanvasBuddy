import type { CourseGrade } from "@/lib/canvas/types";
import {
  DEFAULT_GPA_PREFERENCES,
  type GpaPreferences,
  levelLabel,
  showWeightedGpa,
  weightBonusForLevel,
} from "@/lib/gpa-preferences";

export type CourseLevel = "standard" | "honors" | "ap";

export interface CourseGpaEntry {
  courseId: number;
  courseName: string;
  courseCode?: string;
  level: CourseLevel;
  unweightedPoints: number;
  weightedPoints: number;
  displayGrade: string;
}

export interface GpaResult {
  unweighted: number | null;
  weighted: number | null;
  coursesIncluded: number;
  coursesExcluded: number;
  entries: CourseGpaEntry[];
}

const LETTER_TO_GPA: Record<string, number> = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  "D-": 0.7,
  F: 0.0,
};

const SIMPLE_LETTER_TO_GPA: Record<string, number> = {
  "A+": 4.0,
  A: 4.0,
  "A-": 4.0,
  "B+": 3.0,
  B: 3.0,
  "B-": 3.0,
  "C+": 2.0,
  C: 2.0,
  "C-": 2.0,
  "D+": 1.0,
  D: 1.0,
  "D-": 1.0,
  F: 0.0,
};

function letterToGpaMap(prefs: GpaPreferences): Record<string, number> {
  return prefs.usePlusMinus ? LETTER_TO_GPA : SIMPLE_LETTER_TO_GPA;
}

/** Standard 4.0 scale from percentage (common US high school bands). */
export function percentToUnweightedGpa(
  percent: number,
  prefs: GpaPreferences = DEFAULT_GPA_PREFERENCES
): number {
  if (!prefs.usePlusMinus) {
    if (percent >= 90) return 4.0;
    if (percent >= 80) return 3.0;
    if (percent >= 70) return 2.0;
    if (percent >= 60) return 1.0;
    return 0.0;
  }

  if (percent >= 93) return 4.0;
  if (percent >= 90) return 3.7;
  if (percent >= 87) return 3.3;
  if (percent >= 83) return 3.0;
  if (percent >= 80) return 2.7;
  if (percent >= 77) return 2.3;
  if (percent >= 73) return 2.0;
  if (percent >= 70) return 1.7;
  if (percent >= 67) return 1.3;
  if (percent >= 63) return 1.0;
  if (percent >= 60) return 0.7;
  return 0.0;
}

function parseLetterGrade(
  raw: string,
  prefs: GpaPreferences
): number | null {
  const normalized = raw.trim().toUpperCase();
  const match = normalized.match(/\b([A-F][+-]?)\b/);
  if (!match) return null;
  const map = letterToGpaMap(prefs);
  return map[match[1]] ?? null;
}

function parsePercentFromGrade(raw: string): number | null {
  const match = raw.match(/(\d+(?:\.\d+)?)\s*%?/);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n;
}

export function gradeToUnweightedGpa(
  score: number | null,
  letterGrade: string | null,
  prefs: GpaPreferences = DEFAULT_GPA_PREFERENCES
): number | null {
  if (typeof score === "number" && Number.isFinite(score)) {
    return percentToUnweightedGpa(score, prefs);
  }

  if (letterGrade) {
    const fromLetter = parseLetterGrade(letterGrade, prefs);
    if (fromLetter !== null) return fromLetter;

    const fromPercent = parsePercentFromGrade(letterGrade);
    if (fromPercent !== null) return percentToUnweightedGpa(fromPercent, prefs);
  }

  return null;
}

export function detectCourseLevel(
  courseName: string,
  courseCode?: string
): CourseLevel {
  const text = `${courseName} ${courseCode ?? ""}`.toUpperCase();

  if (
    /\bAP\b/.test(text) ||
    /\bAPE\b/.test(text) ||
    /ADVANCED\s+PLACEMENT/.test(text) ||
    /\bIB\b/.test(text) ||
    /INTERNATIONAL\s+BACCALAUREATE/.test(text)
  ) {
    return "ap";
  }

  if (
    /\bHONORS?\b/.test(text) ||
    /\bHON\b/.test(text) ||
    /\bHN\b/.test(text) ||
    /PRE[-\s]?AP/.test(text)
  ) {
    return "honors";
  }

  return "standard";
}

export function toWeightedGpa(
  unweighted: number,
  level: CourseLevel,
  prefs: GpaPreferences = DEFAULT_GPA_PREFERENCES
): number {
  const bonus = weightBonusForLevel(level, prefs);
  const cap = showWeightedGpa(prefs) ? prefs.maxWeightedGpa : 4.0;
  return Math.min(unweighted + bonus, cap);
}

function formatDisplayGrade(
  score: number | null,
  letterGrade: string | null
): string {
  if (typeof score === "number") return `${score.toFixed(1)}%`;
  if (letterGrade) return letterGrade;
  return "—";
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

export function calculateGpa(
  grades: CourseGrade[],
  prefs: GpaPreferences = DEFAULT_GPA_PREFERENCES
): GpaResult {
  const entries: CourseGpaEntry[] = [];
  let coursesExcluded = 0;

  for (const grade of grades) {
    if (grade.hidden) {
      coursesExcluded += 1;
      continue;
    }

    const unweightedPoints = gradeToUnweightedGpa(
      grade.currentScore,
      grade.currentGrade,
      prefs
    );

    if (unweightedPoints === null) {
      coursesExcluded += 1;
      continue;
    }

    const level = detectCourseLevel(grade.courseName, grade.courseCode);

    entries.push({
      courseId: grade.courseId,
      courseName: grade.courseName,
      courseCode: grade.courseCode,
      level,
      unweightedPoints,
      weightedPoints: toWeightedGpa(unweightedPoints, level, prefs),
      displayGrade: formatDisplayGrade(
        grade.currentScore,
        grade.currentGrade
      ),
    });
  }

  const unweightedValues = entries.map((e) => e.unweightedPoints);
  const weightedValues = entries.map((e) => e.weightedPoints);

  return {
    unweighted: average(unweightedValues),
    weighted: showWeightedGpa(prefs)
      ? average(weightedValues)
      : average(unweightedValues),
    coursesIncluded: entries.length,
    coursesExcluded,
    entries,
  };
}

export function getLevelLabels(
  prefs: GpaPreferences
): Record<CourseLevel, string> {
  return {
    standard: levelLabel("standard", prefs),
    honors: levelLabel("honors", prefs),
    ap: levelLabel("ap", prefs),
  };
}

export function formatGpa(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(2);
}

/** @deprecated Use getLevelLabels(prefs) for user-specific labels. */
export const LEVEL_LABELS: Record<CourseLevel, string> =
  getLevelLabels(DEFAULT_GPA_PREFERENCES);
