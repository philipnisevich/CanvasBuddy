import { filterUpcomingAssignments } from "@/lib/canvas/missing";
import type { HomeData } from "@/lib/canvas/home-data";
import type { MissingPageData } from "@/lib/canvas/missing-data";
import type { UpcomingPageData } from "@/lib/canvas/upcoming-data";
import type {
  AssignmentContextItem,
  CourseGrade,
  GradesPageData,
} from "@/lib/canvas/types";
import type { GpaPreferences } from "@/lib/gpa-preferences";
import type { HomeLayout } from "@/lib/home-layout";

export interface AppDataPayload {
  user: { id: number; name: string };
  timezone: string;
  todayDate: string;
  tomorrowDate: string;
  horizonDays: number;
  /** Current grades for home widgets and the grades page */
  grades: CourseGrade[];
  dueTomorrow: HomeData["dueTomorrow"];
  missing: MissingPageData;
  upcoming: UpcomingPageData;
  /** Full assignment window for client-side horizon refilter */
  assignments: AssignmentContextItem[];
  homeLayout: HomeLayout;
  layoutPersisted: boolean;
  gpaPreferences: GpaPreferences;
}

export function buildGradesPageData(payload: AppDataPayload): GradesPageData {
  return {
    user: payload.user,
    timezone: payload.timezone,
    grades: payload.grades,
  };
}

export function applyHorizonDays(
  payload: AppDataPayload,
  horizonDays: number
): AppDataPayload {
  const upcoming = filterUpcomingAssignments(
    payload.assignments,
    payload.todayDate,
    payload.tomorrowDate,
    horizonDays
  );
  return {
    ...payload,
    horizonDays,
    upcoming: {
      ...payload.upcoming,
      upcoming,
      horizonDays,
    },
  };
}

export function buildHomeData(payload: AppDataPayload): HomeData {
  const upcoming = payload.upcoming.upcoming;
  return {
    user: payload.user,
    grades: payload.grades,
    dueTomorrow: payload.dueTomorrow,
    tomorrowDate: payload.tomorrowDate,
    todayDate: payload.todayDate,
    timezone: payload.timezone,
    assignments: payload.assignments,
    missingCount: payload.missing.items.length,
    missingPreview: payload.missing.items.slice(0, 5),
    upcomingPreview: upcoming.slice(0, 5),
    lateCount: upcoming.filter((a) => a.late).length,
    horizonDays: payload.horizonDays,
  };
}
