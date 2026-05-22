import type {
  AssignmentContextItem,
  DashboardData,
  MissingAssignmentItem,
} from "./types";

export interface HomeData extends DashboardData {
  todayDate: string;
  assignments: AssignmentContextItem[];
  missingCount: number;
  missingPreview: MissingAssignmentItem[];
  upcomingPreview: AssignmentContextItem[];
  lateCount: number;
  horizonDays: number;
}
