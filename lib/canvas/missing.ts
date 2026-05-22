import type { AssignmentContextItem, MissingAssignmentItem } from "./types";

export const MISSING_LOOKBACK_DAYS = 30;

export type MissingReason = "missing" | "overdue" | "zero";

function isZeroGrade(
  a: AssignmentContextItem,
  pointsPossible: number | null
): boolean {
  if (pointsPossible == null || pointsPossible <= 0) return false;
  if (a.excused) return false;
  if (typeof a.score === "number" && a.score === 0) return true;
  if (a.grade === "0" || a.grade === "0%") return true;
  return false;
}

export function classifyMissingAssignments(
  assignments: AssignmentContextItem[],
  todayYmd: string
): MissingAssignmentItem[] {
  const items: MissingAssignmentItem[] = [];

  for (const a of assignments) {
    const reasons: MissingReason[] = [];
    const dueYmd = a.dueDateYmd;
    const pastDue = dueYmd != null && dueYmd < todayYmd;
    const notSubmitted = !a.submitted;

    if (a.missing) reasons.push("missing");
    if (pastDue && notSubmitted) reasons.push("overdue");
    if (isZeroGrade(a, a.pointsPossible)) reasons.push("zero");

    if (reasons.length === 0) continue;

    items.push({
      ...a,
      reasons,
      primaryReason: reasons.includes("missing")
        ? "missing"
        : reasons.includes("overdue")
          ? "overdue"
          : "zero",
    });
  }

  return items.sort((a, b) => {
    const order = { missing: 0, overdue: 1, zero: 2 };
    const diff = order[a.primaryReason] - order[b.primaryReason];
    if (diff !== 0) return diff;
    if (!a.dueAt && !b.dueAt) return a.title.localeCompare(b.title);
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return new Date(b.dueAt).getTime() - new Date(a.dueAt).getTime();
  });
}

export function filterUpcomingAssignments(
  assignments: AssignmentContextItem[],
  todayYmd: string,
  tomorrowYmd: string,
  horizonDays: number
): AssignmentContextItem[] {
  const horizonEnd = (() => {
    const [y, m, d] = todayYmd.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + horizonDays, 12));
    return date.toISOString().slice(0, 10);
  })();

  return assignments.filter((a) => {
    if (!a.dueDateYmd) return false;
    if (a.dueDateYmd <= todayYmd || a.dueDateYmd === tomorrowYmd) return false;
    if (a.dueDateYmd > horizonEnd) return false;
    if (a.submitted) return false;
    return true;
  });
}
