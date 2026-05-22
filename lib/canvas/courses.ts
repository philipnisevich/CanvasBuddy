import { fetchCanvasPaginated } from "./client";
import type { CanvasCourse } from "./types";

export type CourseEnrollmentState = "active" | "completed";

export async function fetchCoursesWithGrades(
  baseUrl: string,
  accessToken: string,
  states: CourseEnrollmentState[] = ["active"]
): Promise<CanvasCourse[]> {
  const all: CanvasCourse[] = [];
  const seen = new Set<number>();

  for (const state of states) {
    const path =
      `/api/v1/courses?enrollment_state=${state}` +
      "&include[]=enrollments&include[]=total_scores" +
      "&include[]=current_grading_period_scores&include[]=grading_periods" +
      "&include[]=term&per_page=100";

    const page = await fetchCanvasPaginated<CanvasCourse>(
      baseUrl,
      path,
      accessToken
    );

    for (const course of page) {
      if (seen.has(course.id)) continue;
      seen.add(course.id);
      all.push(course);
    }
  }

  return all.sort((a, b) => a.name.localeCompare(b.name));
}
