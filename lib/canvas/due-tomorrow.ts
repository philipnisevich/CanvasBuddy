import { formatDueAt } from "@/lib/dates";
import type {
  AssignmentContextItem,
  CanvasPlannerItem,
  DueTomorrowItem,
} from "./types";

const GRADABLE_TYPES = new Set(["assignment", "quiz"]);

export function resolveCanvasHtmlUrl(baseUrl: string, url: string): string {
  if (url.startsWith("http")) return url;
  return `${baseUrl}${url}`;
}

export function mapPlannerDueTomorrow(
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
        htmlUrl: resolveCanvasHtmlUrl(baseUrl, item.html_url),
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

export function dueTomorrowFromAssignments(
  baseUrl: string,
  assignments: AssignmentContextItem[],
  tomorrowYmd: string
): DueTomorrowItem[] {
  return assignments
    .filter(
      (a) =>
        a.dueDateYmd === tomorrowYmd &&
        !a.submitted
    )
    .map((a) => ({
      courseId: a.courseId,
      courseName: a.courseName,
      title: a.title,
      dueAt: a.dueAt,
      dueAtFormatted: a.dueAtFormatted,
      htmlUrl: a.htmlUrl,
      plannableType: a.type,
      missing: a.missing,
      late: a.late,
    }));
}

export function mergeDueTomorrowItems(
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
