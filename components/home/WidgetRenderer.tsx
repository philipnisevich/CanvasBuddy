"use client";

import Link from "next/link";
import { useMemo } from "react";
import DueTomorrowList from "@/components/DueTomorrowList";
import { useApp } from "@/contexts/AppProvider";
import { calculateGpa, formatGpa } from "@/lib/gpa";
import { showWeightedGpa } from "@/lib/gpa-preferences";
import { filterUpcomingAssignments } from "@/lib/canvas/missing";
import type { HomeData } from "@/lib/canvas/home-data";
import { resolveGradesGridCourses } from "@/lib/home-widget-config";
import {
  clampUpcomingDays,
  gradesGridDisplayRows,
  gradesGridSlotCount,
  listRowsForSize,
} from "@/lib/home-widget-sizes";
import type { HomeWidgetInstance } from "@/lib/home-layout";
import type { CourseGrade } from "@/lib/canvas/types";

function pickCourse(
  grades: CourseGrade[],
  courseId?: number
): CourseGrade | null {
  if (!grades.length) return null;
  if (courseId != null) {
    return grades.find((g) => g.courseId === courseId) ?? grades[0];
  }
  return grades[0];
}

function visibleGrades(grades: CourseGrade[]): CourseGrade[] {
  return grades.filter((g) => !g.hidden && g.currentScore != null);
}

function WidgetShell({
  children,
  compact,
  preview,
}: {
  children: React.ReactNode;
  compact?: boolean;
  preview?: boolean;
}) {
  return (
    <div
      className={`cb-card flex h-full min-h-0 flex-col overflow-hidden ${
        preview ? "p-2" : compact ? "p-3" : "p-4"
      }`}
    >
      {children}
    </div>
  );
}

export default function WidgetRenderer({
  widget,
  data,
  compact = false,
  preview = false,
}: {
  widget: HomeWidgetInstance;
  data: HomeData;
  compact?: boolean;
  preview?: boolean;
}) {
  const { gpaPreferences: prefs } = useApp();
  const gridCourses = resolveGradesGridCourses(
    data.grades,
    widget.type === "grades_grid" ? widget.config?.courseIds : undefined,
    widget.type === "grades_grid" ? widget.size : "2x2"
  );
  const gradesSlice = preview
    ? gridCourses.slice(0, 3)
    : widget.type === "grades_grid"
      ? gridCourses
      : data.grades;

  const upcomingDays = clampUpcomingDays(
    widget.type === "upcoming_preview"
      ? widget.config?.days
      : data.horizonDays
  );
  const upcomingFiltered = useMemo(() => {
    if (!data.assignments?.length) return data.upcomingPreview;
    return filterUpcomingAssignments(
      data.assignments,
      data.todayDate,
      data.tomorrowDate,
      upcomingDays
    );
  }, [
    data.assignments,
    data.todayDate,
    data.tomorrowDate,
    data.upcomingPreview,
    upcomingDays,
  ]);
  const upcomingMax = preview
    ? 2
    : widget.type === "upcoming_preview"
      ? listRowsForSize(widget.size)
      : 5;
  const upcomingSlice = upcomingFiltered.slice(0, upcomingMax);

  const missingMax = preview
    ? 2
    : widget.type === "missing_preview"
      ? listRowsForSize(widget.size)
      : 5;
  const missingSlice = preview
    ? data.missingPreview.slice(0, 2)
    : data.missingPreview.slice(0, missingMax);
  const dueTomorrowSlice = preview
    ? data.dueTomorrow.slice(0, 2)
    : data.dueTomorrow;
  const gpa = useMemo(
    () => calculateGpa(data.grades, prefs),
    [data.grades, prefs]
  );
  const visible = visibleGrades(data.grades);
  const lowest = [...visible].sort(
    (a, b) => (a.currentScore ?? 0) - (b.currentScore ?? 0)
  )[0];
  const highest = [...visible].sort(
    (a, b) => (b.currentScore ?? 0) - (a.currentScore ?? 0)
  )[0];
  const course = pickCourse(data.grades, widget.config?.courseId);
  const nextDue = upcomingFiltered[0] ?? data.upcomingPreview[0] ?? null;

  switch (widget.type) {
    case "course_grade": {
      if (!course) {
        return (
          <WidgetShell compact={compact} preview={preview}>
            <p className="text-sm text-[var(--muted)]">No grades</p>
          </WidgetShell>
        );
      }
      return (
        <WidgetShell compact={compact} preview={preview}>
          <p className="cb-section-label truncate">{course.courseName}</p>
          <p className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold">
            {course.hidden
              ? "—"
              : course.currentScore != null
                ? `${course.currentScore}%`
                : course.currentGrade ?? "—"}
          </p>
          {course.currentGrade && !course.hidden && (
            <p className="text-sm text-[var(--muted)]">{course.currentGrade}</p>
          )}
        </WidgetShell>
      );
    }

    case "grades_grid": {
      const slots = preview ? gradesSlice : gridCourses;
      const slotCount = preview ? 4 : gradesGridSlotCount(widget.size);
      const displayRows = preview ? 2 : gradesGridDisplayRows(widget.size);
      const placeholders = Array.from({ length: slotCount }, (_, i) => slots[i] ?? null);
      return (
        <WidgetShell compact={compact} preview={preview}>
          <p className="cb-section-label mb-1 shrink-0">All grades</p>
          <ul
            className="grid min-h-0 flex-1 grid-cols-2 gap-1.5 text-xs"
            style={{ gridTemplateRows: `repeat(${displayRows}, minmax(0, 1fr))` }}
          >
            {placeholders.map((g, i) => (
              <li
                key={g ? g.courseId : `empty-${i}`}
                className="flex min-h-0 flex-col justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-muted)] px-2 py-1"
              >
                {g ? (
                  <>
                    <span className="block truncate font-semibold leading-tight">
                      {g.courseName}
                    </span>
                    <span className="text-[var(--color-canvas-red)]">
                      {g.hidden
                        ? "Hidden"
                        : g.currentScore != null
                          ? `${g.currentScore}%`
                          : g.currentGrade ?? "—"}
                    </span>
                  </>
                ) : (
                  <span className="text-[var(--muted)]">—</span>
                )}
              </li>
            ))}
          </ul>
        </WidgetShell>
      );
    }

    case "grades_list": {
      const max = preview ? 3 : (widget.config?.maxRows ?? 6);
      return (
        <WidgetShell compact={compact} preview={preview}>
          <p className="cb-section-label mb-2">Courses</p>
          <ul className="flex-1 space-y-1 overflow-y-auto text-sm">
            {data.grades.slice(0, max).map((g) => (
              <li
                key={g.courseId}
                className="flex justify-between gap-2 border-b border-[var(--border)] py-1"
              >
                <span className="truncate font-medium">{g.courseName}</span>
                <span className="shrink-0 font-semibold">
                  {g.currentScore != null ? `${g.currentScore}%` : "—"}
                </span>
              </li>
            ))}
          </ul>
        </WidgetShell>
      );
    }

    case "unweighted_gpa":
      return (
        <WidgetShell compact={compact} preview={preview}>
          <p className="cb-section-label">Unweighted GPA</p>
          <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold">
            {formatGpa(gpa.unweighted)}
          </p>
        </WidgetShell>
      );

    case "weighted_gpa":
      return (
        <WidgetShell compact={compact} preview={preview}>
          <p className="cb-section-label">Weighted GPA</p>
          <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold">
            {showWeightedGpa(prefs)
              ? formatGpa(gpa.weighted)
              : "—"}
          </p>
        </WidgetShell>
      );

    case "gpa_both":
      return (
        <WidgetShell compact={compact} preview={preview}>
          <div className="grid h-full min-h-0 grid-cols-2 items-center gap-3">
            <div className="min-w-0 text-center sm:text-left">
              <p className="cb-section-label">Unweighted</p>
              <p className="font-[family-name:var(--font-heading)] text-3xl font-bold leading-none">
                {formatGpa(gpa.unweighted)}
              </p>
            </div>
            <div className="min-w-0 text-center sm:text-left">
              <p className="cb-section-label">Weighted</p>
              <p className="font-[family-name:var(--font-heading)] text-3xl font-bold leading-none">
                {showWeightedGpa(prefs) ? formatGpa(gpa.weighted) : "—"}
              </p>
            </div>
          </div>
        </WidgetShell>
      );

    case "term_gpa":
      return (
        <WidgetShell compact={compact} preview={preview}>
          <p className="cb-section-label">Term GPA (est.)</p>
          <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold leading-none">
            {formatGpa(gpa.unweighted)}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {gpa.coursesIncluded} courses
          </p>
        </WidgetShell>
      );

    case "lowest_grade":
      return (
        <WidgetShell compact={compact} preview={preview}>
          <p className="cb-section-label">Needs attention</p>
          {lowest ? (
            <>
              <p className="truncate font-semibold">{lowest.courseName}</p>
              <p className="text-2xl font-bold text-[var(--danger)]">
                {lowest.currentScore}%
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">—</p>
          )}
        </WidgetShell>
      );

    case "highest_grade":
      return (
        <WidgetShell compact={compact} preview={preview}>
          <p className="cb-section-label">Best grade</p>
          {highest ? (
            <>
              <p className="truncate font-semibold">{highest.courseName}</p>
              <p className="text-2xl font-bold text-[var(--success)]">
                {highest.currentScore}%
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">—</p>
          )}
        </WidgetShell>
      );

    case "course_count":
      return (
        <WidgetShell compact={compact} preview={preview}>
          <p className="cb-section-label">Courses</p>
          <p className="text-3xl font-bold">{data.grades.length}</p>
        </WidgetShell>
      );

    case "due_tomorrow_count":
      return (
        <WidgetShell compact={compact} preview={preview}>
          <p className="cb-section-label">Due tomorrow</p>
          <p className="text-3xl font-bold">{data.dueTomorrow.length}</p>
          <p className="text-xs text-[var(--muted)]">{data.tomorrowDate}</p>
        </WidgetShell>
      );

    case "due_tomorrow_list":
      return (
        <div className="h-full min-h-full overflow-hidden">
          <DueTomorrowList
            items={preview ? dueTomorrowSlice : data.dueTomorrow}
            tomorrowDate={data.tomorrowDate}
            embedded
          />
        </div>
      );

    case "upcoming_preview": {
      return (
        <WidgetShell compact={compact} preview={preview}>
          <p className="cb-section-label mb-2 shrink-0">
            Next {upcomingDays} days
          </p>
          <ul className="flex-1 space-y-2 overflow-y-auto text-sm">
            {upcomingSlice.length === 0 ? (
              <li className="text-[var(--muted)]">Nothing coming up</li>
            ) : (
              upcomingSlice.map((a) => (
                <li key={`${a.assignmentId}-${a.courseId}`}>
                  <span className="font-semibold">{a.title}</span>
                  <span className="block text-xs text-[var(--muted)]">
                    {a.dueAtFormatted}
                  </span>
                </li>
              ))
            )}
          </ul>
          {!preview && (
            <Link href="/upcoming" className="cb-link mt-2 text-xs font-semibold">
              View all →
            </Link>
          )}
        </WidgetShell>
      );
    }

    case "next_due":
      return (
        <WidgetShell compact={compact} preview={preview}>
          <p className="cb-section-label">Next due</p>
          {nextDue ? (
            <>
              <p className="font-semibold">{nextDue.title}</p>
              <p className="text-sm text-[var(--muted)]">{nextDue.courseName}</p>
              <p className="mt-2 text-sm font-bold">{nextDue.dueAtFormatted}</p>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">Nothing scheduled</p>
          )}
        </WidgetShell>
      );

    case "missing_count":
      return (
        <WidgetShell compact={compact} preview={preview}>
          <p className="cb-section-label">Missing</p>
          <p className="text-3xl font-bold text-[var(--danger)]">
            {data.missingCount}
          </p>
          {!preview && (
            <Link href="/missing" className="cb-link text-xs font-semibold">
              View →
            </Link>
          )}
        </WidgetShell>
      );

    case "missing_preview":
      return (
        <WidgetShell compact={compact} preview={preview}>
          <p className="cb-section-label mb-2">Missing</p>
          <ul className="flex-1 space-y-1 overflow-y-auto text-sm">
            {missingSlice.length === 0 ? (
              <li className="text-[var(--muted)]">All caught up</li>
            ) : (
              missingSlice.map((a) => (
                <li key={`${a.assignmentId}-${a.courseId}`} className="truncate">
                  {a.title}
                </li>
              ))
            )}
          </ul>
          {!preview && (
            <Link href="/missing" className="cb-link mt-2 text-xs font-semibold">
              View all →
            </Link>
          )}
        </WidgetShell>
      );

    case "late_count":
      return (
        <WidgetShell compact={compact} preview={preview}>
          <p className="cb-section-label">Late</p>
          <p className="text-3xl font-bold text-[var(--warning)]">
            {data.lateCount}
          </p>
        </WidgetShell>
      );

    case "timezone":
      return (
        <WidgetShell compact={compact} preview={preview}>
          <p className="cb-section-label">Timezone</p>
          <p className="mt-1 truncate text-lg font-bold leading-tight">
            {data.timezone.split("/").pop()?.replace(/_/g, " ") ?? data.timezone}
          </p>
        </WidgetShell>
      );

    case "ai_shortcut":
      return (
        <WidgetShell compact={compact} preview={preview}>
          <div className="flex h-full min-h-0 flex-col">
            <p className="cb-section-label shrink-0">AI helper</p>
            <p className="mt-1 shrink-0 text-[11px] leading-snug text-[var(--muted)]">
              Ask about due dates, grades, and classes.
            </p>
            {!preview && (
              <Link
                href="/ai"
                className="cb-btn-primary mt-auto block shrink-0 py-1.5 text-center text-xs"
              >
                Open assistant
              </Link>
            )}
          </div>
        </WidgetShell>
      );

    case "quick_stats":
      return (
        <WidgetShell compact={compact} preview={preview}>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <p className="cb-section-label">Courses</p>
              <p className="text-xl font-bold">{data.grades.length}</p>
            </div>
            <div>
              <p className="cb-section-label">Tomorrow</p>
              <p className="text-xl font-bold">{data.dueTomorrow.length}</p>
            </div>
            <div>
              <p className="cb-section-label">Missing</p>
              <p className="text-xl font-bold text-[var(--danger)]">
                {data.missingCount}
              </p>
            </div>
          </div>
        </WidgetShell>
      );

    default:
      return (
        <WidgetShell compact={compact} preview={preview}>
          <p className="text-sm text-[var(--muted)]">Unknown widget</p>
        </WidgetShell>
      );
  }
}
