"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import type { CourseGrade } from "@/lib/canvas/types";
import { useApp } from "@/contexts/AppProvider";
import {
  calculateGpa,
  formatGpa,
  getLevelLabels,
  type CourseLevel,
} from "@/lib/gpa";
import { showWeightedGpa } from "@/lib/gpa-preferences";
import Link from "next/link";

const LEVEL_STYLES: Record<CourseLevel, string> = {
  standard: "bg-[var(--card-muted)] text-[var(--color-text-muted)]",
  honors: "bg-[var(--warning-soft)] text-[var(--warning)]",
  ap: "bg-[var(--accent-soft)] text-[var(--color-canvas-red)]",
};

interface GpaCalculatorProps {
  grades: CourseGrade[];
}

export default function GpaCalculator({ grades }: GpaCalculatorProps) {
  const { gpaPreferences: prefs } = useApp();
  const [showBreakdown, setShowBreakdown] = useState(false);

  const levelLabels = useMemo(() => getLevelLabels(prefs), [prefs]);
  const result = useMemo(
    () => calculateGpa(grades, prefs),
    [grades, prefs]
  );
  const weightedEnabled = showWeightedGpa(prefs);
  const hasGpa = result.coursesIncluded > 0;

  return (
    <section className="cb-card overflow-hidden">
      <div className="border-b border-[var(--border)] bg-[var(--card-muted)] px-5 py-4">
        <p className="cb-section-label">Academics</p>
        <h2 className="text-lg font-semibold">GPA estimate</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Calculated from your Canvas course grades using your{" "}
          <Link href="/settings?tab=gpa" className="cb-link">
            GPA settings
          </Link>
          . AP/IB and Honors are detected from course names.
        </p>
      </div>

      <div
        className={`grid gap-4 p-5 ${weightedEnabled ? "sm:grid-cols-2" : "max-w-sm"}`}
      >
        <GpaStat
          label="Unweighted GPA"
          value={formatGpa(result.unweighted)}
          scale={prefs.usePlusMinus ? "4.0 with +/-" : "4.0 (no +/-)"}
          highlight={hasGpa}
        />
        {weightedEnabled && (
          <GpaStat
            label="Weighted GPA"
            value={formatGpa(result.weighted)}
            scale={`Up to ${prefs.maxWeightedGpa.toFixed(1)} scale`}
            highlight={hasGpa}
          />
        )}
      </div>

      {!hasGpa && (
        <p className="border-t border-[var(--border)] px-5 py-4 text-sm text-[var(--muted)]">
          No gradable courses yet — connect Canvas or wait for teachers to post
          scores.
          {result.coursesExcluded > 0 &&
            ` (${result.coursesExcluded} course${result.coursesExcluded === 1 ? "" : "s"} hidden or without scores.)`}
        </p>
      )}

      {hasGpa && (
        <>
          <p className="px-5 pb-3 text-xs text-[var(--muted)]">
            Based on {result.coursesIncluded} course
            {result.coursesIncluded === 1 ? "" : "s"}
            {result.coursesExcluded > 0 &&
              ` · ${result.coursesExcluded} excluded (hidden or no score)`}
            . Estimates only — your school&apos;s official GPA may differ.
          </p>

          <div className="border-t border-[var(--border)] px-5 py-3">
            <button
              type="button"
              onClick={() => setShowBreakdown((v) => !v)}
              className="cb-link inline-flex cursor-pointer items-center gap-1 text-sm"
              aria-expanded={showBreakdown}
            >
              {showBreakdown ? (
                <>
                  <ChevronUp className="h-4 w-4" aria-hidden />
                  Hide course breakdown
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" aria-hidden />
                  Show course breakdown
                </>
              )}
            </button>
          </div>

          {showBreakdown && (
            <ul className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
              {result.entries.map((entry) => (
                <li
                  key={entry.courseId}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{entry.courseName}</p>
                    {entry.courseCode && (
                      <p className="text-xs text-[var(--muted)]">
                        {entry.courseCode}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[var(--muted)]">
                      {entry.displayGrade}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${LEVEL_STYLES[entry.level]}`}
                    >
                      {levelLabels[entry.level]}
                    </span>
                    <span className="tabular-nums font-medium">
                      {entry.unweightedPoints.toFixed(1)}
                      {weightedEnabled && (
                        <>
                          {" "}
                          → {entry.weightedPoints.toFixed(1)}
                        </>
                      )}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function GpaStat({
  label,
  value,
  scale,
  highlight,
}: {
  label: string;
  value: string;
  scale: string;
  highlight: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius)] border px-4 py-4 ${
        highlight
          ? "border-[var(--color-canvas-red)]/35 bg-[var(--accent-soft)]"
          : "border-[var(--border)] bg-[var(--card-muted)]"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 cb-metric text-4xl font-bold tabular-nums text-[var(--color-text)]">
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">{scale}</p>
    </div>
  );
}
