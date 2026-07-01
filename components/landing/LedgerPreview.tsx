import { CalendarClock, CircleAlert } from "lucide-react";

type Row = { course: string; pct: string; letter: string; watch?: boolean };

const ROWS: Row[] = [
  { course: "Biology 201", pct: "91", letter: "A−" },
  { course: "U.S. History", pct: "88", letter: "B+" },
  { course: "Calculus II", pct: "79", letter: "C+", watch: true },
];

/**
 * A faithful, static preview of the CanvasBuddy dashboard rendered in the real
 * "Ledger" vocabulary — flat surface, hairline rows, mono numerics. It shows
 * the whole product at a glance (GPA, per-course grades, upcoming, missing)
 * without pretending to be live data.
 */
export default function LedgerPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="cb-card overflow-hidden"
      role="img"
      aria-label="Preview of a CanvasBuddy dashboard showing an estimated GPA of 3.74, three course grades, two assignments due this week, and one missing item."
    >
      {/* Ledger header */}
      <div className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-3.5">
        <span className="font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--ink)]">
          Fall term
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--hairline-strong)] px-2 py-1 text-[0.6875rem] font-semibold text-[var(--muted-ink)]">
          <span
            className="h-1.5 w-1.5 rounded-full bg-[var(--success)]"
            aria-hidden
          />
          Synced with Canvas
        </span>
      </div>

      {/* GPA hero figure */}
      <div className="flex items-end justify-between px-5 pt-5 pb-4">
        <div>
          <p className="cb-section-label">Estimated GPA</p>
          <p className="cb-metric mt-2 text-[2.75rem] leading-none text-[var(--ink)]">
            3.74
          </p>
        </div>
        <p className="mb-1 text-xs text-[var(--muted-ink)]">across 5 courses</p>
      </div>

      {/* Per-course grade rows */}
      <div className="border-t border-[var(--hairline)]">
        {ROWS.map((r) => (
          <div
            key={r.course}
            className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-3 last:border-b-0"
          >
            <span className="truncate text-sm font-medium text-[var(--ink)]">
              {r.course}
            </span>
            <span className="flex items-center gap-3">
              <span
                className={`cb-metric text-sm ${
                  r.watch ? "text-[var(--warning-ink)]" : "text-[var(--ink-2)]"
                }`}
              >
                {r.pct}%
              </span>
              <span className="inline-flex min-w-[2.25rem] justify-center rounded-[var(--radius-sm)] border border-[var(--hairline-strong)] px-1.5 py-0.5 text-xs font-semibold text-[var(--ink)]">
                {r.letter}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Footer strip: what's next / what's missing */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--hairline)] bg-[var(--surface-2)] px-5 py-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted-ink)]">
            <CalendarClock className="h-4 w-4 text-[var(--accent-ink)]" aria-hidden />
            2 due this week
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted-ink)]">
            <CircleAlert className="h-4 w-4 text-[var(--warning-ink)]" aria-hidden />
            1 missing
          </span>
        </div>
      )}
    </div>
  );
}
