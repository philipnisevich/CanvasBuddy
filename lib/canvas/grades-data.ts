import { fetchCanvasUser } from "./client-core";
import { fetchCoursesWithGrades } from "./courses";
import { mapCourseGrades } from "./grades";
import type { GradesPageData } from "./types";

export async function fetchGradesPageData(
  baseUrl: string,
  accessToken: string,
  timezone: string
): Promise<GradesPageData> {
  const [user, activeCourses] = await Promise.all([
    fetchCanvasUser(baseUrl, accessToken),
    fetchCoursesWithGrades(baseUrl, accessToken, ["active"]),
  ]);

  return {
    user: { id: user.id, name: user.name },
    timezone,
    grades: mapCourseGrades(activeCourses),
  };
}
