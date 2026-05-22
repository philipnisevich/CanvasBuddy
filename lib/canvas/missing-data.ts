import { getYmdInTimezone } from "@/lib/dates";
import { fetchAssignmentsInWindow } from "./assignments-fetch";
import { fetchCanvasUser } from "./client-core";
import { fetchCoursesWithGrades } from "./courses";
import {
  classifyMissingAssignments,
  MISSING_LOOKBACK_DAYS,
} from "./missing";
import type { MissingAssignmentItem } from "./types";

export interface MissingPageData {
  user: { id: number; name: string };
  timezone: string;
  todayDate: string;
  items: MissingAssignmentItem[];
}

export async function fetchMissingPageData(
  baseUrl: string,
  accessToken: string,
  timezone: string
): Promise<MissingPageData> {
  const todayDate = getYmdInTimezone(new Date(), timezone);
  const [user, courses] = await Promise.all([
    fetchCanvasUser(baseUrl, accessToken),
    fetchCoursesWithGrades(baseUrl, accessToken, ["active"]),
  ]);

  const assignments = await fetchAssignmentsInWindow(
    baseUrl,
    accessToken,
    courses,
    timezone,
    MISSING_LOOKBACK_DAYS,
    7,
    todayDate
  );

  const items = classifyMissingAssignments(assignments, todayDate);

  return {
    user: { id: user.id, name: user.name },
    timezone,
    todayDate,
    items,
  };
}
