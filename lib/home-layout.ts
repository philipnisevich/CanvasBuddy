import {
  dedupeOverlaps,
  migrateOrderedLayout,
  sizeToSpan,
} from "@/lib/home-grid";
import { clampWidgetSize } from "@/lib/home-widget-sizes";
import type { CourseGrade } from "@/lib/canvas/types";

export type WidgetSize = "1x1" | "1x2" | "2x1" | "2x2" | "2x3";

export type WidgetType =
  | "course_grade"
  | "grades_grid"
  | "grades_list"
  | "unweighted_gpa"
  | "weighted_gpa"
  | "gpa_both"
  | "term_gpa"
  | "lowest_grade"
  | "highest_grade"
  | "course_count"
  | "due_tomorrow_count"
  | "due_tomorrow_list"
  | "upcoming_preview"
  | "next_due"
  | "missing_count"
  | "missing_preview"
  | "late_count"
  | "timezone"
  | "ai_shortcut"
  | "quick_stats";

export interface WidgetConfig {
  courseId?: number;
  /** Up to 6 course IDs for grades_grid */
  courseIds?: number[];
  days?: number;
  maxRows?: number;
}

export interface HomeWidgetInstance {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  col: number;
  row: number;
  config?: WidgetConfig;
}

export type HomeLayout = HomeWidgetInstance[];

export const WIDGET_CATALOG: {
  type: WidgetType;
  label: string;
  description: string;
  defaultSize: WidgetSize;
}[] = [
  {
    type: "course_grade",
    label: "Course grade",
    description: "One class score and letter",
    defaultSize: "1x1",
  },
  {
    type: "grades_grid",
    label: "All grades",
    description: "Grid of every course",
    defaultSize: "2x2",
  },
  {
    type: "grades_list",
    label: "Grades list",
    description: "Compact course list",
    defaultSize: "2x1",
  },
  {
    type: "unweighted_gpa",
    label: "Unweighted GPA",
    description: "4.0 scale estimate",
    defaultSize: "1x1",
  },
  {
    type: "weighted_gpa",
    label: "Weighted GPA",
    description: "Honors/AP weighted estimate",
    defaultSize: "1x1",
  },
  {
    type: "gpa_both",
    label: "GPA (both)",
    description: "Unweighted and weighted",
    defaultSize: "2x1",
  },
  {
    type: "term_gpa",
    label: "Term GPA",
    description: "GPA for current term",
    defaultSize: "1x1",
  },
  {
    type: "lowest_grade",
    label: "Needs attention",
    description: "Lowest course grade",
    defaultSize: "1x1",
  },
  {
    type: "highest_grade",
    label: "Best grade",
    description: "Highest course grade",
    defaultSize: "1x1",
  },
  {
    type: "course_count",
    label: "Course count",
    description: "Active enrollments",
    defaultSize: "1x1",
  },
  {
    type: "due_tomorrow_count",
    label: "Due tomorrow",
    description: "Count for tomorrow",
    defaultSize: "1x1",
  },
  {
    type: "due_tomorrow_list",
    label: "Due tomorrow list",
    description: "Tomorrow's assignments",
    defaultSize: "2x2",
  },
  {
    type: "upcoming_preview",
    label: "Coming up",
    description: "Next few days preview",
    defaultSize: "2x1",
  },
  {
    type: "next_due",
    label: "Next due",
    description: "Soonest assignment",
    defaultSize: "1x2",
  },
  {
    type: "missing_count",
    label: "Missing count",
    description: "Missing or overdue items",
    defaultSize: "1x1",
  },
  {
    type: "missing_preview",
    label: "Missing preview",
    description: "Top missing assignments",
    defaultSize: "2x1",
  },
  {
    type: "late_count",
    label: "Late count",
    description: "Late submissions",
    defaultSize: "1x1",
  },
  {
    type: "timezone",
    label: "Timezone",
    description: "Your due-date timezone",
    defaultSize: "1x1",
  },
  {
    type: "ai_shortcut",
    label: "AI helper",
    description: "Open study assistant",
    defaultSize: "1x1",
  },
  {
    type: "quick_stats",
    label: "Quick stats",
    description: "Courses, due, missing",
    defaultSize: "2x1",
  },
];

const catalogByType = new Map(WIDGET_CATALOG.map((e) => [e.type, e]));

export function getCatalogEntry(type: WidgetType) {
  return catalogByType.get(type);
}

export function getDefaultSize(type: WidgetType): WidgetSize {
  return catalogByType.get(type)?.defaultSize ?? "1x1";
}

export function createWidgetId(): string {
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Default dashboard for new users (matches standard 4-column starter layout). */
export const DEFAULT_HOME_LAYOUT: HomeLayout = [
  { id: "default-1", type: "grades_grid", size: "2x2", col: 0, row: 0 },
  { id: "default-2", type: "course_grade", size: "1x1", col: 2, row: 0 },
  { id: "default-3", type: "missing_count", size: "1x1", col: 3, row: 0 },
  { id: "default-4", type: "gpa_both", size: "2x1", col: 0, row: 2 },
  {
    id: "default-5",
    type: "upcoming_preview",
    size: "2x2",
    col: 2,
    row: 1,
    config: { days: 7 },
  },
  { id: "default-6", type: "due_tomorrow_list", size: "2x1", col: 0, row: 3 },
  { id: "default-7", type: "timezone", size: "1x1", col: 2, row: 3 },
  { id: "default-8", type: "ai_shortcut", size: "1x1", col: 3, row: 3 },
];

export { sizeToSpan } from "@/lib/home-grid";

export function sizeLabel(size: WidgetSize): string {
  const { w, h } = sizeToSpan(size);
  return `${w}×${h}`;
}

export function createWidgetFromCatalog(
  type: WidgetType,
  grades: CourseGrade[]
): HomeWidgetInstance | null {
  const entry = getCatalogEntry(type);
  if (!entry) return null;

  const config =
    type === "course_grade" && grades[0]
      ? { courseId: grades[0].courseId }
      : type === "grades_grid" && grades.length > 0
        ? {
            courseIds: grades
              .slice(0, 6)
              .map((g) => g.courseId),
          }
        : type === "upcoming_preview"
          ? { days: 3 }
          : undefined;

  return {
    id: createWidgetId(),
    type,
    size: entry.defaultSize,
    col: 0,
    row: 0,
    config,
  };
}

export function normalizeHomeLayout(raw: unknown): HomeLayout {
  if (!Array.isArray(raw)) return [...DEFAULT_HOME_LAYOUT];

  const validTypes = new Set(WIDGET_CATALOG.map((w) => w.type));
  const parsed: Omit<HomeWidgetInstance, "col" | "row">[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const type = o.type as WidgetType;
    if (!validTypes.has(type)) continue;

    const rawSize = o.size as WidgetSize | undefined;
    const size = clampWidgetSize(
      type,
      rawSize && typeof rawSize === "string" ? rawSize : getDefaultSize(type)
    );
    parsed.push({
      id: typeof o.id === "string" ? o.id : createWidgetId(),
      type,
      size,
      config:
        o.config && typeof o.config === "object"
          ? (o.config as WidgetConfig)
          : undefined,
    });
  }

  if (parsed.length === 0) return [...DEFAULT_HOME_LAYOUT];

  const hasPositions = raw.some(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof (item as Record<string, unknown>).col === "number" &&
      typeof (item as Record<string, unknown>).row === "number"
  );

  if (!hasPositions) {
    return dedupeOverlaps(migrateOrderedLayout(parsed));
  }

  const withPositions: HomeLayout = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const type = o.type as WidgetType;
    if (!validTypes.has(type)) continue;

    const col = o.col;
    const row = o.row;
    if (typeof col !== "number" || typeof row !== "number") continue;
    if (col < 0 || col > 3 || row < 0) continue;

    const rawSize = o.size as WidgetSize | undefined;
    const size = clampWidgetSize(
      type,
      rawSize && typeof rawSize === "string" ? rawSize : getDefaultSize(type)
    );

    withPositions.push({
      id: typeof o.id === "string" ? o.id : createWidgetId(),
      type,
      size,
      col: Math.floor(col),
      row: Math.floor(row),
      config:
        o.config && typeof o.config === "object"
          ? (o.config as WidgetConfig)
          : undefined,
    });
  }

  const deduped = dedupeOverlaps(withPositions);
  return deduped.length > 0 ? deduped : [...DEFAULT_HOME_LAYOUT];
}

/** @deprecated Use gridStyle from home-grid for explicit placement */
export function sizeToGridClass(size: WidgetSize): string {
  switch (size) {
    case "1x1":
      return "col-span-1 row-span-1";
    case "1x2":
      return "col-span-1 row-span-2";
    case "2x1":
      return "col-span-2 row-span-1";
    case "2x2":
      return "col-span-2 row-span-2";
    case "2x3":
      return "col-span-2 row-span-3";
    default:
      return "col-span-1 row-span-1";
  }
}
