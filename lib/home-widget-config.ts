import type { CourseGrade } from "@/lib/canvas/types";
import {
  clampUpcomingDays,
  gradesGridSlotCount,
} from "@/lib/home-widget-sizes";

export const GRADES_GRID_MAX_COURSES = 6;
import type { WidgetSize } from "@/lib/home-layout";
import type {
  HomeLayout,
  HomeWidgetInstance,
  WidgetConfig,
  WidgetType,
} from "@/lib/home-layout";

export const CONFIGURABLE_WIDGET_TYPES: WidgetType[] = [
  "course_grade",
  "grades_grid",
  "upcoming_preview",
];

export function isConfigurableWidget(type: WidgetType): boolean {
  return CONFIGURABLE_WIDGET_TYPES.includes(type);
}

export function defaultGradesGridCourseIds(grades: CourseGrade[]): number[] {
  return grades.slice(0, GRADES_GRID_MAX_COURSES).map((g) => g.courseId);
}

export function resolveGradesGridCourses(
  grades: CourseGrade[],
  courseIds: number[] | undefined,
  size: WidgetSize
): CourseGrade[] {
  const slotCount = gradesGridSlotCount(size);
  const byId = new Map(grades.map((g) => [g.courseId, g]));
  const ids =
    courseIds && courseIds.length > 0
      ? courseIds.slice(0, GRADES_GRID_MAX_COURSES)
      : defaultGradesGridCourseIds(grades);

  const resolved: CourseGrade[] = [];
  for (const id of ids) {
    const g = byId.get(id);
    if (g) resolved.push(g);
  }
  const fallback =
    resolved.length > 0
      ? resolved
      : grades.slice(0, GRADES_GRID_MAX_COURSES);
  return fallback.slice(0, slotCount);
}

export function normalizeWidgetConfig(
  type: WidgetType,
  config: WidgetConfig | undefined,
  grades: CourseGrade[]
): WidgetConfig | undefined {
  if (type === "course_grade") {
    const valid =
      config?.courseId != null &&
      grades.some((g) => g.courseId === config.courseId);
    const courseId = valid ? config!.courseId! : grades[0]?.courseId;
    return courseId != null ? { courseId } : undefined;
  }

  if (type === "grades_grid") {
    const validIds = new Set(grades.map((g) => g.courseId));
    let courseIds = (config?.courseIds ?? []).filter((id) => validIds.has(id));
    if (courseIds.length === 0) {
      courseIds = defaultGradesGridCourseIds(grades);
    }
    return { courseIds: courseIds.slice(0, GRADES_GRID_MAX_COURSES) };
  }

  if (type === "upcoming_preview") {
    return { days: clampUpcomingDays(config?.days) };
  }

  return config;
}

export function normalizeLayoutConfigs(
  layout: HomeWidgetInstance[],
  grades: CourseGrade[]
): HomeLayout {
  return layout.map((w) => ({
    ...w,
    config: normalizeWidgetConfig(w.type, w.config, grades),
  }));
}
