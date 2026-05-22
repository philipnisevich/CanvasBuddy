import { sizeToSpan } from "@/lib/home-grid";
import type { WidgetSize, WidgetType } from "@/lib/home-layout";

/** Tall/wide list widgets that support grow & shrink in customize mode */
export const RESIZABLE_WIDGET_TYPES: WidgetType[] = [
  "grades_grid",
  "due_tomorrow_list",
  "upcoming_preview",
  "missing_preview",
  "grades_list",
];

const SIZE_STEPS: Partial<Record<WidgetType, WidgetSize[]>> = {
  grades_grid: ["2x1", "2x2", "2x3"],
  due_tomorrow_list: ["2x1", "2x2", "2x3"],
  upcoming_preview: ["2x1", "2x2", "2x3"],
  missing_preview: ["2x1", "2x2"],
  grades_list: ["2x1", "2x2"],
  gpa_both: ["2x1"],
  term_gpa: ["1x1"],
};

export function isResizableWidget(type: WidgetType): boolean {
  return RESIZABLE_WIDGET_TYPES.includes(type);
}

export function getAllowedSizes(type: WidgetType): WidgetSize[] {
  return SIZE_STEPS[type] ?? [getDefaultSizeFallback(type)];
}

function getDefaultSizeFallback(type: WidgetType): WidgetSize {
  return SIZE_STEPS[type]?.[0] ?? "1x1";
}

export function clampWidgetSize(type: WidgetType, size: WidgetSize): WidgetSize {
  const allowed = getAllowedSizes(type);
  if (allowed.includes(size)) return size;
  const defaults: Partial<Record<WidgetType, WidgetSize>> = {
    grades_grid: "2x2",
    due_tomorrow_list: "2x2",
    upcoming_preview: "2x1",
    missing_preview: "2x1",
    grades_list: "2x1",
    gpa_both: "2x1",
    term_gpa: "1x1",
  };
  if (type === "gpa_both" && size === "1x2") return "2x1";
  if (type === "term_gpa" && size !== "1x1") return "1x1";
  const preferred = defaults[type];
  if (preferred && allowed.includes(preferred)) return preferred;
  return allowed[0] ?? size;
}

export function getNextSize(
  type: WidgetType,
  current: WidgetSize,
  direction: "grow" | "shrink"
): WidgetSize | null {
  const steps = getAllowedSizes(type);
  const idx = steps.indexOf(clampWidgetSize(type, current));
  if (idx < 0) return null;
  const nextIdx = direction === "grow" ? idx + 1 : idx - 1;
  if (nextIdx < 0 || nextIdx >= steps.length) return null;
  return steps[nextIdx];
}

/** Course cells shown in All grades (not equal to unit w×h). */
export function gradesGridSlotCount(size: WidgetSize): number {
  switch (size) {
    case "2x1":
      return 2;
    case "2x2":
      return 6;
    case "2x3":
      return 8;
    default:
      return 4;
  }
}

/** Internal grid rows inside the All grades card (2 columns). */
export function gradesGridDisplayRows(size: WidgetSize): number {
  switch (size) {
    case "2x1":
      return 1;
    case "2x2":
      return 3;
    case "2x3":
      return 4;
    default:
      return 2;
  }
}

export const UPCOMING_DAYS_MIN = 1;
export const UPCOMING_DAYS_MAX = 30;

export function clampUpcomingDays(days: unknown): number {
  let n =
    typeof days === "number" && !Number.isNaN(days)
      ? Math.round(days)
      : 3;
  if (n < UPCOMING_DAYS_MIN) n = UPCOMING_DAYS_MIN;
  if (n > UPCOMING_DAYS_MAX) n = UPCOMING_DAYS_MAX;
  return n;
}

/** Max list rows to show by widget height (row units). */
export function listRowsForSize(size: WidgetSize): number {
  return sizeToSpan(size).h * 4;
}
