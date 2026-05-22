import { getTomorrowYmd, getYmdInTimezone, formatDueAt } from "@/lib/dates";
import { fetchCoursesWithGrades } from "./courses";
import { mapCourseGrades } from "./grades";
import type {
  CanvasAssignment,
  CanvasCourse,
  CanvasPlannerItem,
  DueTomorrowItem,
  DashboardData,
} from "./types";

export {
  CanvasApiError,
  fetchCanvasPaginated,
  fetchCanvasUser,
  verifyCanvasToken,
} from "./client-core";

import { fetchCanvasPaginated, fetchCanvasUser } from "./client-core";

const GRADABLE_TYPES = new Set(["assignment", "quiz"]);
const SUBMITTED_STATES = new Set(["submitted", "graded", "pending_review"]);

function resolveHtmlUrl(baseUrl: string, url: string): string {
  if (url.startsWith("http")) return url;
  return `${baseUrl}${url}`;
}

function mapDueTomorrow(
  baseUrl: string,
  items: CanvasPlannerItem[],
  courseNameById: Map<number, string>,
  timezone: string
): DueTomorrowItem[] {
  return items
    .filter((item) =>
      GRADABLE_TYPES.has(item.plannable_type?.toLowerCase() ?? "")
    )
    .map((item) => {
      const courseId = item.course_id ?? 0;
      const courseName =
        courseNameById.get(courseId) ?? `Course ${courseId}`;
      const title =
        item.plannable?.name ?? item.plannable?.title ?? "Untitled";
      const dueAt = item.plannable?.due_at ?? null;
      const subs =
        typeof item.submissions === "object" ? item.submissions : null;

      return {
        courseId,
        courseName,
        title,
        dueAt,
        dueAtFormatted: formatDueAt(dueAt, timezone),
        htmlUrl: resolveHtmlUrl(baseUrl, item.html_url),
        plannableType: item.plannable_type,
        missing: subs?.missing ?? false,
        late: subs?.late ?? false,
      };
    })
    .sort((a, b) => {
      if (!a.dueAt && !b.dueAt) return a.title.localeCompare(b.title);
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });
}

function assignmentPlannableType(a: CanvasAssignment): string {
  if (a.submission_types?.includes("online_quiz")) return "quiz";
  return "assignment";
}

async function fetchDueTomorrowFromAssignments(
  baseUrl: string,
  accessToken: string,
  courses: CanvasCourse[],
  timezone: string,
  tomorrowYmd: string
): Promise<DueTomorrowItem[]> {
  const items: DueTomorrowItem[] = [];

  await Promise.all(
    courses.map(async (course) => {
      const path = `/api/v1/courses/${course.id}/assignments?include[]=submission&order_by=due_at&per_page=100`;
      let assignments: CanvasAssignment[];
      try {
        assignments = await fetchCanvasPaginated<CanvasAssignment>(
          baseUrl,
          path,
          accessToken
        );
      } catch {
        return;
      }

      for (const a of assignments) {
        if (!a.due_at) continue;
        if (getYmdInTimezone(a.due_at, timezone) !== tomorrowYmd) continue;

        const sub = a.submission;
        if (sub?.workflow_state && SUBMITTED_STATES.has(sub.workflow_state)) {
          continue;
        }

        items.push({
          courseId: course.id,
          courseName: course.name,
          title: a.name,
          dueAt: a.due_at,
          dueAtFormatted: formatDueAt(a.due_at, timezone),
          htmlUrl: resolveHtmlUrl(
            baseUrl,
            a.html_url ?? `/courses/${course.id}/assignments/${a.id}`
          ),
          plannableType: assignmentPlannableType(a),
          missing: sub?.missing ?? false,
          late: sub?.late ?? false,
        });
      }
    })
  );

  return items.sort((a, b) => {
    if (!a.dueAt && !b.dueAt) return a.title.localeCompare(b.title);
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

function mergeDueTomorrowItems(
  ...lists: DueTomorrowItem[][]
): DueTomorrowItem[] {
  const seen = new Set<string>();
  const merged: DueTomorrowItem[] = [];
  for (const list of lists) {
    for (const item of list) {
      const key = `${item.courseId}:${item.htmlUrl}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  return merged.sort((a, b) => {
    if (!a.dueAt && !b.dueAt) return a.title.localeCompare(b.title);
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

export async function fetchDashboardData(
  baseUrl: string,
  accessToken: string,
  timezone: string
): Promise<DashboardData> {
  const tomorrowYmd = getTomorrowYmd(timezone);
  const plannerPath = `/api/v1/planner/items?start_date=${tomorrowYmd}&end_date=${tomorrowYmd}&per_page=100`;

  const [user, courses, plannerItems] = await Promise.all([
    fetchCanvasUser(baseUrl, accessToken),
    fetchCoursesWithGrades(baseUrl, accessToken, ["active"]),
    fetchCanvasPaginated<CanvasPlannerItem>(
      baseUrl,
      plannerPath,
      accessToken
    ),
  ]);

  const courseNameById = new Map(
    courses.map((c) => [c.id, c.name] as [number, string])
  );

  const fromPlanner = mapDueTomorrow(
    baseUrl,
    plannerItems,
    courseNameById,
    timezone
  );
  const fromAssignments = await fetchDueTomorrowFromAssignments(
    baseUrl,
    accessToken,
    courses,
    timezone,
    tomorrowYmd
  );
  const dueTomorrow = mergeDueTomorrowItems(fromAssignments, fromPlanner);

  return {
    user: { id: user.id, name: user.name },
    grades: mapCourseGrades(courses),
    dueTomorrow,
    tomorrowDate: tomorrowYmd,
    timezone,
  };
}
