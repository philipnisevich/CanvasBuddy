import { getTomorrowYmd, getYmdInTimezone } from "@/lib/dates";
import { fetchAssignmentsInWindow } from "./assignments-fetch";
import { fetchCoursesWithGrades } from "./courses";
import { fetchDashboardData } from "./client";
import { filterUpcomingAssignments } from "./missing";
import type { AssignmentContextItem, DueTomorrowItem } from "./types";

export interface UpcomingPageData {
  user: { id: number; name: string };
  timezone: string;
  todayDate: string;
  tomorrowDate: string;
  dueTomorrow: DueTomorrowItem[];
  upcoming: AssignmentContextItem[];
  horizonDays: number;
}

export async function fetchUpcomingPageData(
  baseUrl: string,
  accessToken: string,
  timezone: string,
  horizonDays: number
): Promise<UpcomingPageData> {
  const dashboard = await fetchDashboardData(baseUrl, accessToken, timezone);
  const todayDate = getYmdInTimezone(new Date(), timezone);
  const tomorrowDate = getTomorrowYmd(timezone);

  const courses = await fetchCoursesWithGrades(baseUrl, accessToken, ["active"]);
  const assignments = await fetchAssignmentsInWindow(
    baseUrl,
    accessToken,
    courses,
    timezone,
    0,
    horizonDays + 2,
    todayDate
  );

  const upcoming = filterUpcomingAssignments(
    assignments,
    todayDate,
    tomorrowDate,
    horizonDays
  );

  return {
    user: dashboard.user,
    timezone,
    todayDate,
    tomorrowDate,
    dueTomorrow: dashboard.dueTomorrow,
    upcoming,
    horizonDays,
  };
}
