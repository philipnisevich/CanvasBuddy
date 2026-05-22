"use client";

import { useEffect, useRef, useState } from "react";
import type { CourseGrade } from "@/lib/canvas/types";
import {
  GRADES_GRID_MAX_COURSES,
  defaultGradesGridCourseIds,
} from "@/lib/home-widget-config";
import {
  UPCOMING_DAYS_MAX,
  UPCOMING_DAYS_MIN,
  clampUpcomingDays,
} from "@/lib/home-widget-sizes";
import type { HomeWidgetInstance, WidgetConfig } from "@/lib/home-layout";

const UPCOMING_PRESETS = [3, 7, 14, 30] as const;

export default function WidgetConfigDialog({
  widget,
  grades,
  open,
  onClose,
  onSave,
}: {
  widget: HomeWidgetInstance | null;
  grades: CourseGrade[];
  open: boolean;
  onClose: () => void;
  onSave: (widgetId: string, config: WidgetConfig) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [upcomingDays, setUpcomingDays] = useState(3);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!widget) return;
    if (widget.type === "course_grade") {
      const id =
        widget.config?.courseId != null &&
        grades.some((g) => g.courseId === widget.config?.courseId)
          ? widget.config.courseId
          : (grades[0]?.courseId ?? null);
      setCourseId(id);
    }
    if (widget.type === "grades_grid") {
      const ids =
        widget.config?.courseIds?.length &&
        widget.config.courseIds.every((id) =>
          grades.some((g) => g.courseId === id)
        )
          ? widget.config.courseIds.slice(0, GRADES_GRID_MAX_COURSES)
          : defaultGradesGridCourseIds(grades);
      setSelectedIds(ids);
    }
    if (widget.type === "upcoming_preview") {
      setUpcomingDays(clampUpcomingDays(widget.config?.days));
    }
  }, [widget, grades]);

  if (!widget) return null;

  function handleSave() {
    const base = widget!.config ?? {};
    if (widget!.type === "course_grade" && courseId != null) {
      onSave(widget!.id, { ...base, courseId });
    }
    if (widget!.type === "grades_grid") {
      onSave(widget!.id, {
        ...base,
        courseIds: selectedIds.slice(0, GRADES_GRID_MAX_COURSES),
      });
    }
    if (widget!.type === "upcoming_preview") {
      onSave(widget!.id, {
        ...base,
        days: clampUpcomingDays(upcomingDays),
      });
    }
    onClose();
  }

  function toggleCourse(id: number) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= GRADES_GRID_MAX_COURSES) return prev;
      return [...prev, id];
    });
  }

  const title =
    widget.type === "course_grade"
      ? "Choose class"
      : widget.type === "grades_grid"
        ? "Choose classes to show"
        : "Coming up window";

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-[min(24rem,calc(100vw-2rem))] rounded-[var(--radius-lg)] border-2 border-[var(--border)] bg-[var(--card)] p-0 shadow-[var(--shadow-clay)] backdrop:bg-black/40"
    >
      <div className="border-b border-[var(--border)] px-5 py-4">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {widget.type === "grades_grid"
            ? `Select up to ${GRADES_GRID_MAX_COURSES} courses. Resize the widget to show more or fewer.`
            : widget.type === "upcoming_preview"
              ? "Assignments due after tomorrow within this many days."
              : "Pick which course grade appears on this tile."}
        </p>
      </div>
      <div className="max-h-64 overflow-y-auto px-5 py-4">
        {widget.type === "course_grade" && (
          <ul className="space-y-1">
            {grades.map((g) => (
              <li key={g.courseId}>
                <label className="flex cursor-pointer items-center gap-2 rounded-[var(--radius)] px-2 py-2 hover:bg-[var(--card-muted)]">
                  <input
                    type="radio"
                    name="course"
                    checked={courseId === g.courseId}
                    onChange={() => setCourseId(g.courseId)}
                    className="cursor-pointer"
                  />
                  <span className="truncate text-sm font-medium">
                    {g.courseName}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {widget.type === "grades_grid" && (
          <>
            <p className="mb-2 text-xs text-[var(--muted)]">
              {selectedIds.length} / {GRADES_GRID_MAX_COURSES} selected
            </p>
            <ul className="space-y-1">
              {grades.map((g) => {
                const checked = selectedIds.includes(g.courseId);
                const atMax =
                  selectedIds.length >= GRADES_GRID_MAX_COURSES && !checked;
                return (
                  <li key={g.courseId}>
                    <label
                      className={`flex items-center gap-2 rounded-[var(--radius)] px-2 py-2 ${
                        atMax
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer hover:bg-[var(--card-muted)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={atMax}
                        onChange={() => toggleCourse(g.courseId)}
                        className="cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="truncate text-sm font-medium">
                        {g.courseName}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {widget.type === "upcoming_preview" && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="upcoming-days"
                className="cb-section-label block"
              >
                Days ahead
              </label>
              <input
                id="upcoming-days"
                type="number"
                min={UPCOMING_DAYS_MIN}
                max={UPCOMING_DAYS_MAX}
                value={upcomingDays}
                onChange={(e) =>
                  setUpcomingDays(clampUpcomingDays(Number(e.target.value)))
                }
                className="cb-input mt-2 w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {UPCOMING_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setUpcomingDays(d)}
                  className={`cb-chip ${upcomingDays === d ? "cb-chip--active" : ""}`}
                >
                  {d} days
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className="cb-btn-ghost px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={
            widget.type === "grades_grid" && selectedIds.length === 0
          }
          className="cb-btn-primary cursor-pointer px-4 py-1.5 text-sm"
        >
          Save
        </button>
      </div>
    </dialog>
  );
}
