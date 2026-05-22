import { stripHtml } from "@/lib/html";
import { formatDueAt, getYmdInTimezone } from "@/lib/dates";
import { fetchCanvasPaginated } from "./client";
import type {
  AssignmentContextItem,
  CanvasAssignment,
  CanvasCourse,
} from "./types";

const MAX_DESCRIPTION_CHARS = 1500;
export const SUBMITTED_STATES = new Set([
  "submitted",
  "graded",
  "pending_review",
]);

function resolveHtmlUrl(baseUrl: string, url: string): string {
  if (url.startsWith("http")) return url;
  return `${baseUrl}${url}`;
}

function assignmentType(a: CanvasAssignment): string {
  if (a.submission_types?.includes("online_quiz")) return "quiz";
  return "assignment";
}

function truncateDescription(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const plain = stripHtml(raw);
  if (!plain) return null;
  if (plain.length <= MAX_DESCRIPTION_CHARS) return plain;
  return `${plain.slice(0, MAX_DESCRIPTION_CHARS)}…`;
}

export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days, 12));
  return date.toISOString().slice(0, 10);
}

export function isDueInRange(
  dueYmd: string | null,
  windowStart: string,
  windowEnd: string
): boolean {
  if (!dueYmd) return true;
  return dueYmd >= windowStart && dueYmd <= windowEnd;
}

export function isSubmitted(sub: CanvasAssignment["submission"]): boolean {
  return !!sub?.workflow_state && SUBMITTED_STATES.has(sub.workflow_state);
}

export async function fetchAssignmentsInWindow(
  baseUrl: string,
  accessToken: string,
  courses: CanvasCourse[],
  timezone: string,
  lookbackDays: number,
  lookaheadDays: number,
  todayYmd: string
): Promise<AssignmentContextItem[]> {
  const windowStart = addDaysYmd(todayYmd, -lookbackDays);
  const windowEnd = addDaysYmd(todayYmd, lookaheadDays);
  const assignments: AssignmentContextItem[] = [];

  await Promise.all(
    courses.map(async (course) => {
      const path = `/api/v1/courses/${course.id}/assignments?include[]=submission&order_by=due_at&per_page=100`;
      let courseAssignments: CanvasAssignment[];
      try {
        courseAssignments = await fetchCanvasPaginated<CanvasAssignment>(
          baseUrl,
          path,
          accessToken
        );
      } catch {
        return;
      }

      for (const a of courseAssignments) {
        if (a.published === false) continue;

        const dueDateYmd = a.due_at
          ? getYmdInTimezone(a.due_at, timezone)
          : null;

        if (!isDueInRange(dueDateYmd, windowStart, windowEnd)) {
          continue;
        }

        const sub = a.submission;
        const submitted = isSubmitted(sub);

        assignments.push({
          courseId: course.id,
          courseName: course.name,
          assignmentId: a.id,
          title: a.name,
          dueAt: a.due_at,
          dueAtFormatted: formatDueAt(a.due_at, timezone),
          dueDateYmd,
          pointsPossible:
            typeof a.points_possible === "number" ? a.points_possible : null,
          type: assignmentType(a),
          htmlUrl: resolveHtmlUrl(
            baseUrl,
            a.html_url ?? `/courses/${course.id}/assignments/${a.id}`
          ),
          missing: sub?.missing ?? false,
          late: sub?.late ?? false,
          submitted,
          description: truncateDescription(a.description),
          score: typeof sub?.score === "number" ? sub.score : null,
          grade: sub?.grade ?? null,
          excused: sub?.excused ?? false,
        });
      }
    })
  );

  assignments.sort((a, b) => {
    if (!a.dueAt && !b.dueAt) return a.title.localeCompare(b.title);
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });

  return assignments;
}
