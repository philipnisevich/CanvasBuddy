import type { CanvasCourse, CanvasEnrollment, CourseGrade } from "./types";

/** Canvas returns "student" or "StudentEnrollment" depending on endpoint/version. */
export const STUDENT_ENROLLMENT_TYPES = new Set([
  "StudentEnrollment",
  "student",
]);

export function findStudentEnrollment(course: CanvasCourse) {
  return course.enrollments?.find((e) =>
    STUDENT_ENROLLMENT_TYPES.has(e.type)
  );
}

export function pickDisplayGrade(
  enrollment: CanvasEnrollment,
  options?: { gradingPeriodId?: number | null }
): {
  score: number | null;
  grade: string | null;
} {
  const periodId = options?.gradingPeriodId ?? null;
  const usePeriodFields =
    periodId == null ||
    periodId === enrollment.current_grading_period_id;

  if (
    usePeriodFields &&
    enrollment.has_grading_periods &&
    enrollment.current_grading_period_id != null &&
    (enrollment.current_period_computed_current_score != null ||
      enrollment.current_period_computed_current_grade != null)
  ) {
    return {
      score: enrollment.current_period_computed_current_score ?? null,
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

/** Final / concluded term grades when available. */
export function pickTermFinalGrade(enrollment: CanvasEnrollment): {
  score: number | null;
  grade: string | null;
} {
  if (
    enrollment.grades?.final_score != null ||
    enrollment.grades?.final_grade != null
  ) {
    return {
      score: enrollment.grades.final_score ?? null,
      grade: enrollment.grades.final_grade ?? null,
    };
  }

  if (
    enrollment.computed_final_score != null ||
    enrollment.computed_final_grade != null
  ) {
    return {
      score: enrollment.computed_final_score ?? null,
      grade: enrollment.computed_final_grade ?? null,
    };
  }

  return pickDisplayGrade(enrollment);
}

export function mapCourseGrades(
  courses: CanvasCourse[],
  options?: { useFinalGrades?: boolean; gradingPeriodId?: number | null }
): CourseGrade[] {
  const useFinal = options?.useFinalGrades ?? false;
  const gradingPeriodId = options?.gradingPeriodId ?? null;

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
          termId: course.enrollment_term_id ?? course.term?.id ?? null,
          hasGradingPeriods: !!enrollment.has_grading_periods,
        };
      }

      const { score, grade } = useFinal
        ? pickTermFinalGrade(enrollment)
        : pickDisplayGrade(enrollment, { gradingPeriodId });
      const hidden = score === null && grade === null;

      return {
        courseId: course.id,
        courseName: course.name,
        courseCode: course.course_code,
        currentScore: typeof score === "number" ? score : null,
        currentGrade: grade ?? null,
        gradesUrl: enrollment.grades?.html_url ?? null,
        hidden,
        termId: course.enrollment_term_id ?? course.term?.id ?? null,
        hasGradingPeriods: !!enrollment.has_grading_periods,
      };
    })
    .filter((g): g is CourseGrade => g !== null)
    .sort((a, b) => a.courseName.localeCompare(b.courseName));
}

export function coursesHaveGradingPeriods(courses: CanvasCourse[]): boolean {
  return courses.some((c) => {
    const e = findStudentEnrollment(c);
    return !!e?.has_grading_periods;
  });
}
