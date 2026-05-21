import type { CourseGrade } from "@/lib/canvas/types";

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

/** Standard 4.0 scale from percentage (common US high school bands). */
export function percentToUnweightedGpa(percent: number): number {
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

function parseLetterGrade(raw: string): number | null {
  const normalized = raw.trim().toUpperCase();
  const match = normalized.match(/\b([A-F][+-]?)\b/);
  if (!match) return null;
  return LETTER_TO_GPA[match[1]] ?? null;
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
  letterGrade: string | null
): number | null {
  if (typeof score === "number" && Number.isFinite(score)) {
    return percentToUnweightedGpa(score);
  }

  if (letterGrade) {
    const fromLetter = parseLetterGrade(letterGrade);
    if (fromLetter !== null) return fromLetter;

    const fromPercent = parsePercentFromGrade(letterGrade);
    if (fromPercent !== null) return percentToUnweightedGpa(fromPercent);
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

const WEIGHT_BONUS: Record<CourseLevel, number> = {
  standard: 0,
  honors: 0.5,
  ap: 1.0,
};

export function toWeightedGpa(
  unweighted: number,
  level: CourseLevel
): number {
  return Math.min(unweighted + WEIGHT_BONUS[level], 5.0);
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

export function calculateGpa(grades: CourseGrade[]): GpaResult {
  const entries: CourseGpaEntry[] = [];
  let coursesExcluded = 0;

  for (const grade of grades) {
    if (grade.hidden) {
      coursesExcluded += 1;
      continue;
    }

    const unweightedPoints = gradeToUnweightedGpa(
      grade.currentScore,
      grade.currentGrade
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
      weightedPoints: toWeightedGpa(unweightedPoints, level),
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
    weighted: average(weightedValues),
    coursesIncluded: entries.length,
    coursesExcluded,
    entries,
  };
}

export function formatGpa(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(2);
}

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  standard: "Standard",
  honors: "Honors (+0.5)",
  ap: "AP / IB (+1.0)",
};
