import { getTomorrowYmd, getYmdInTimezone, formatDueAt } from "@/lib/dates";
import type {
  CanvasAssignment,
  CanvasCourse,
  CanvasEnrollment,
  CanvasPlannerItem,
  CanvasUser,
  CourseGrade,
  DueTomorrowItem,
  DashboardData,
} from "./types";

const GRADABLE_TYPES = new Set(["assignment", "quiz"]);

/** Canvas returns "student" or "StudentEnrollment" depending on endpoint/version. */
const STUDENT_ENROLLMENT_TYPES = new Set(["StudentEnrollment", "student"]);

const SUBMITTED_STATES = new Set(["submitted", "graded", "pending_review"]);

function findStudentEnrollment(course: CanvasCourse) {
  return course.enrollments?.find((e) =>
    STUDENT_ENROLLMENT_TYPES.has(e.type)
  );
}

function parseLinkHeader(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : null;
}

export class CanvasApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "CanvasApiError";
  }
}

export async function fetchCanvasPaginated<T>(
  baseUrl: string,
  path: string,
  accessToken: string
): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = `${baseUrl}${path}`;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new CanvasApiError(
        `Canvas API error (${res.status}): ${text.slice(0, 200)}`,
        res.status
      );
    }

    const page = (await res.json()) as T[];
    results.push(...page);
    url = parseLinkHeader(res.headers.get("Link"));
  }

  return results;
}

export async function fetchCanvasUser(
  baseUrl: string,
  accessToken: string
): Promise<CanvasUser> {
  const res = await fetch(`${baseUrl}/api/v1/users/self`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new CanvasApiError(`Failed to fetch user (${res.status})`, res.status);
  }

  return res.json() as Promise<CanvasUser>;
}

export async function verifyCanvasToken(
  baseUrl: string,
  accessToken: string
): Promise<CanvasUser> {
  return fetchCanvasUser(baseUrl, accessToken);
}

function pickDisplayGrade(enrollment: CanvasEnrollment): {
  score: number | null;
  grade: string | null;
} {
  if (
    enrollment.has_grading_periods &&
    enrollment.current_grading_period_id != null &&
    enrollment.current_period_computed_current_score != null
  ) {
    return {
      score: enrollment.current_period_computed_current_score,
      grade: enrollment.current_period_computed_current_grade ?? null,
    };
  }

  if (
    enrollment.grades?.current_score != null ||
    enrollment.grades?.current_grade != null
  ) {
    return {
      score: enrollment.grades.current_score ?? null,
      grade: enrollment.grades.current_grade ?? null,
    };
  }

  return {
    score: enrollment.computed_current_score ?? null,
    grade: enrollment.computed_current_grade ?? null,
  };
}

function mapCourseGrades(courses: CanvasCourse[]): CourseGrade[] {
  return courses
    .map((course): CourseGrade | null => {
      const enrollment = findStudentEnrollment(course);
      if (!enrollment) return null;

      if (course.hide_final_grades) {
        return {
          courseId: course.id,
          courseName: course.name,
          courseCode: course.course_code,
          currentScore: null,
          currentGrade: null,
          gradesUrl: enrollment.grades?.html_url ?? null,
          hidden: true,
        };
      }

      const { score, grade } = pickDisplayGrade(enrollment);
      const hidden = score === null && grade === null;

      return {
        courseId: course.id,
        courseName: course.name,
        courseCode: course.course_code,
        currentScore: typeof score === "number" ? score : null,
        currentGrade: grade ?? null,
        gradesUrl: enrollment.grades?.html_url ?? null,
        hidden,
      };
    })
    .filter((g): g is CourseGrade => g !== null)
    .sort((a, b) => a.courseName.localeCompare(b.courseName));
}

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

  const coursesPath =
    "/api/v1/courses?enrollment_state=active&include[]=enrollments&include[]=total_scores&include[]=current_grading_period_scores&per_page=100";
  const plannerPath = `/api/v1/planner/items?start_date=${tomorrowYmd}&end_date=${tomorrowYmd}&per_page=100`;

  const [user, courses, plannerItems] = await Promise.all([
    fetchCanvasUser(baseUrl, accessToken),
    fetchCanvasPaginated<CanvasCourse>(baseUrl, coursesPath, accessToken),
    fetchCanvasPaginated<CanvasPlannerItem>(baseUrl, plannerPath, accessToken),
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
