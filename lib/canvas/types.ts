export interface CanvasEnrollment {
  type: string;
  role: string;
  computed_current_score?: number | null;
  computed_final_score?: number | null;
  computed_current_grade?: string | null;
  computed_final_grade?: string | null;
  has_grading_periods?: boolean;
  totals_for_all_grading_periods_option?: boolean;
  current_grading_period_id?: number | null;
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

export interface CanvasCourse {
  id: number;
  name: string;
  course_code?: string;
  hide_final_grades?: boolean;
  enrollments?: CanvasEnrollment[];
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
    submitted_at?: string | null;
  };
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
}

export interface AssignmentAssistantContext {
  userName: string;
  timezone: string;
  todayDate: string;
  tomorrowDate: string;
  grades: CourseGrade[];
  assignments: AssignmentContextItem[];
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
