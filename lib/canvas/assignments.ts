import { getTomorrowYmd, getYmdInTimezone } from "@/lib/dates";
import { fetchAssignmentsInWindow } from "./assignments-fetch";
import { fetchCoursesWithGrades } from "./courses";
import { mapCourseGrades } from "./grades";
import type { AssignmentAssistantContext } from "./types";

export const ASSISTANT_LOOKBACK_DAYS = 30;
export const ASSISTANT_LOOKAHEAD_DAYS = 120;

export async function fetchAssignmentAssistantContext(
  baseUrl: string,
  accessToken: string,
  timezone: string,
  userName: string
): Promise<AssignmentAssistantContext> {
  const todayDate = getYmdInTimezone(new Date(), timezone);
  const tomorrowDate = getTomorrowYmd(timezone);

  const courses = await fetchCoursesWithGrades(baseUrl, accessToken, ["active"]);
  const assignments = await fetchAssignmentsInWindow(
    baseUrl,
    accessToken,
    courses,
    timezone,
    ASSISTANT_LOOKBACK_DAYS,
    ASSISTANT_LOOKAHEAD_DAYS,
    todayDate
  );

  return {
    userName,
    timezone,
    todayDate,
    tomorrowDate,
    grades: mapCourseGrades(courses),
    assignments,
  };
}
