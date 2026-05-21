import { stripHtml } from "@/lib/html";
import {
  formatDueAt,
  getTomorrowYmd,
  getYmdInTimezone,
} from "@/lib/dates";
import { fetchCanvasPaginated } from "./client";
import type {
  AssignmentAssistantContext,
  AssignmentContextItem,
  CanvasAssignment,
  CanvasCourse,
  CourseGrade,
} from "./types";

const MAX_DESCRIPTION_CHARS = 1500;
const LOOKAHEAD_DAYS = 90;
const LOOKBACK_DAYS = 14;

const STUDENT_ENROLLMENT_TYPES = new Set(["StudentEnrollment", "student"]);
const SUBMITTED_STATES = new Set(["submitted", "graded", "pending_review"]);

function findStudentEnrollment(course: CanvasCourse) {
  return course.enrollments?.find((e) =>
    STUDENT_ENROLLMENT_TYPES.has(e.type)
  );
}

function pickDisplayGrade(enrollment: NonNullable<ReturnType<typeof findStudentEnrollment>>): {
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

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days, 12));
  return date.toISOString().slice(0, 10);
}

function isDueInRange(
  dueYmd: string | null,
  todayYmd: string,
  windowStart: string,
  windowEnd: string
): boolean {
  if (!dueYmd) return true;
  return dueYmd >= windowStart && dueYmd <= windowEnd;
}

export async function fetchAssignmentAssistantContext(
  baseUrl: string,
  accessToken: string,
  timezone: string,
  userName: string
): Promise<AssignmentAssistantContext> {
  const todayDate = getYmdInTimezone(new Date(), timezone);
  const tomorrowDate = getTomorrowYmd(timezone);
  const windowStart = addDaysYmd(todayDate, -LOOKBACK_DAYS);
  const windowEnd = addDaysYmd(todayDate, LOOKAHEAD_DAYS);

  const coursesPath =
    "/api/v1/courses?enrollment_state=active&include[]=enrollments&include[]=total_scores&include[]=current_grading_period_scores&per_page=100";

  const courses = await fetchCanvasPaginated<CanvasCourse>(
    baseUrl,
    coursesPath,
    accessToken
  );

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

        if (!isDueInRange(dueDateYmd, todayDate, windowStart, windowEnd)) {
          continue;
        }

        const sub = a.submission;
        const submitted =
          !!sub?.workflow_state && SUBMITTED_STATES.has(sub.workflow_state);

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

  return {
    userName,
    timezone,
    todayDate,
    tomorrowDate,
    grades: mapCourseGrades(courses),
    assignments,
  };
}
