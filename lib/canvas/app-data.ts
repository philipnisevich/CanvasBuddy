import { getTomorrowYmd, getYmdInTimezone } from "@/lib/dates";
import type { AppDataPayload } from "@/lib/app-data";
import { fetchAssignmentsInWindow } from "./assignments-fetch";
import { fetchCanvasPaginated, fetchCanvasUser } from "./client-core";
import { fetchCoursesWithGrades } from "./courses";
import {
  dueTomorrowFromAssignments,
  mapPlannerDueTomorrow,
  mergeDueTomorrowItems,
} from "./due-tomorrow";
import { mapCourseGrades } from "./grades";
import {
  classifyMissingAssignments,
  filterUpcomingAssignments,
  MISSING_LOOKBACK_DAYS,
} from "./missing";
import type { CanvasPlannerItem } from "./types";

const MAX_HORIZON = 14;

export async function fetchAppData(
  baseUrl: string,
  accessToken: string,
  timezone: string,
  horizonDays: number
): Promise<
  Omit<AppDataPayload, "homeLayout" | "layoutPersisted" | "gpaPreferences">
> {
  const tomorrowYmd = getTomorrowYmd(timezone);
  const todayDate = getYmdInTimezone(new Date(), timezone);
  const lookahead = Math.max(horizonDays + 2, MAX_HORIZON + 2);

  const plannerPath = `/api/v1/planner/items?start_date=${tomorrowYmd}&end_date=${tomorrowYmd}&per_page=100`;

  const [user, activeCourses, plannerItems] = await Promise.all([
    fetchCanvasUser(baseUrl, accessToken),
    fetchCoursesWithGrades(baseUrl, accessToken, ["active"]),
    fetchCanvasPaginated<CanvasPlannerItem>(
      baseUrl,
      plannerPath,
      accessToken
    ),
  ]);

  const grades = mapCourseGrades(activeCourses);

  const assignments = await fetchAssignmentsInWindow(
    baseUrl,
    accessToken,
    activeCourses,
    timezone,
    MISSING_LOOKBACK_DAYS,
    lookahead,
    todayDate
  );

  const courseNameById = new Map(
    activeCourses.map((c) => [c.id, c.name] as [number, string])
  );

  const dueTomorrow = mergeDueTomorrowItems(
    mapPlannerDueTomorrow(
      baseUrl,
      plannerItems,
      courseNameById,
      timezone
    ),
    dueTomorrowFromAssignments(baseUrl, assignments, tomorrowYmd)
  );

  const missingItems = classifyMissingAssignments(assignments, todayDate);
  const upcoming = filterUpcomingAssignments(
    assignments,
    todayDate,
    tomorrowYmd,
    horizonDays
  );

  return {
    user: { id: user.id, name: user.name },
    timezone,
    todayDate,
    tomorrowDate: tomorrowYmd,
    horizonDays,
    grades,
    dueTomorrow,
    missing: {
      user: { id: user.id, name: user.name },
      timezone,
      todayDate,
      items: missingItems,
    },
    upcoming: {
      user: { id: user.id, name: user.name },
      timezone,
      todayDate,
      tomorrowDate: tomorrowYmd,
      dueTomorrow,
      upcoming,
      horizonDays,
    },
    assignments,
  };
}
