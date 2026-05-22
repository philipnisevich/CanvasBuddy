export interface CanvasGradingPeriod {
  id: number;
  title?: string;
  start_date?: string | null;
  end_date?: string | null;
  close_date?: string | null;
  is_closed?: boolean;
}

export interface CanvasEnrollment {
  type: string;
  role: string;
  course_id?: number;
  computed_current_score?: number | null;
  computed_final_score?: number | null;
  computed_current_grade?: string | null;
  computed_final_grade?: string | null;
  has_grading_periods?: boolean;
  totals_for_all_grading_periods_option?: boolean;
  current_grading_period_id?: number | null;
  current_grading_period_title?: string | null;
  current_period_computed_current_score?: number | null;
  current_period_computed_current_grade?: string | null;
  current_period_computed_final_score?: number | null;
  current_period_computed_final_grade?: string | null;
  grades?: {
    current_score?: number | null;
    final_score?: number | null;
    current_grade?: string | null;
    final_grade?: string | null;
    html_url?: string;
  };
}

export interface CanvasTerm {
  id: number;
  name: string;
  start_at?: string | null;
  end_at?: string | null;
}

export interface CanvasCourse {
  id: number;
  name: string;
  course_code?: string;
  hide_final_grades?: boolean;
  enrollment_term_id?: number;
  term?: CanvasTerm | null;
  enrollments?: CanvasEnrollment[];
  grading_periods?: CanvasGradingPeriod[];
  has_grading_periods?: boolean;
}

export interface GradingPeriodOption {
  id: number;
  title: string;
  startAt: string | null;
  endAt: string | null;
}

export interface CanvasUser {
  id: number;
  name: string;
  short_name?: string;
  avatar_url?: string;
}

export interface CanvasAssignment {
  id: number;
  name: string;
  description?: string | null;
  due_at: string | null;
  points_possible?: number | null;
  published?: boolean;
  html_url?: string;
  submission_types?: string[];
  submission?: {
    workflow_state?: string;
    missing?: boolean;
    late?: boolean;
    excused?: boolean;
    score?: number | null;
    grade?: string | null;
    submitted_at?: string | null;
  };
}

export interface EnrollmentTerm {
  id: number;
  name: string;
  startAt: string | null;
  endAt: string | null;
  courseCount: number;
}

export interface AssignmentContextItem {
  courseId: number;
  courseName: string;
  assignmentId: number;
  title: string;
  dueAt: string | null;
  dueAtFormatted: string;
  dueDateYmd: string | null;
  pointsPossible: number | null;
  type: string;
  htmlUrl: string;
  missing: boolean;
  late: boolean;
  submitted: boolean;
  description: string | null;
  score?: number | null;
  grade?: string | null;
  excused?: boolean;
}

export type MissingReason = "missing" | "overdue" | "zero";

export interface MissingAssignmentItem extends AssignmentContextItem {
  reasons: MissingReason[];
  primaryReason: MissingReason;
}

export interface GpaSummaryContext {
  unweighted: number | null;
  weighted: number | null;
  coursesIncluded: number;
}

export interface AssignmentAssistantContext {
  userName: string;
  timezone: string;
  todayDate: string;
  tomorrowDate: string;
  grades: CourseGrade[];
  assignments: AssignmentContextItem[];
  gpaSummary?: GpaSummaryContext | null;
}

export interface CanvasPlannerPlannable {
  id?: number;
  name?: string;
  title?: string;
  due_at?: string | null;
}

export interface CanvasPlannerItem {
  context_type: string;
  course_id?: number;
  plannable_id: string;
  plannable_type: string;
  plannable: CanvasPlannerPlannable;
  html_url: string;
  submissions?:
    | false
    | {
        excused?: boolean;
        graded?: boolean;
        late?: boolean;
        missing?: boolean;
        needs_grading?: boolean;
        with_feedback?: boolean;
      };
}

export interface CanvasTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: CanvasUser;
}

export interface CourseGrade {
  courseId: number;
  courseName: string;
  courseCode?: string;
  currentScore: number | null;
  currentGrade: string | null;
  gradesUrl: string | null;
  hidden: boolean;
  termId?: number | null;
  hasGradingPeriods?: boolean;
}

export interface GradesPageData {
  user: { id: number; name: string };
  timezone: string;
  grades: CourseGrade[];
}

export interface DueTomorrowItem {
  courseId: number;
  courseName: string;
  title: string;
  dueAt: string | null;
  dueAtFormatted: string;
  htmlUrl: string;
  plannableType: string;
  missing: boolean;
  late: boolean;
}

export interface DashboardData {
  user: { id: number; name: string };
  grades: CourseGrade[];
  dueTomorrow: DueTomorrowItem[];
  tomorrowDate: string;
  timezone: string;
}
