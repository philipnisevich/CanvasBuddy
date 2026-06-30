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
