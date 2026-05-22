import { ExternalLink } from "lucide-react";
import type { MissingAssignmentItem } from "@/lib/canvas/types";

const REASON_LABELS = {
  missing: "Missing",
  overdue: "Overdue",
  zero: "Zero",
} as const;

function groupByCourse(
  items: MissingAssignmentItem[]
): Map<string, MissingAssignmentItem[]> {
  const groups = new Map<string, MissingAssignmentItem[]>();
  for (const item of items) {
    const list = groups.get(item.courseName) ?? [];
    list.push(item);
    groups.set(item.courseName, list);
  }
  return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export default function MissingAssignmentList({
  items,
}: {
  items: MissingAssignmentItem[];
}) {
  if (items.length === 0) {
    return (
      <div className="cb-card flex flex-col items-center px-6 py-12 text-center">
        <p className="font-bold text-[var(--color-text)]">Nothing missing</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          No missing, overdue, or zero-score assignments in the recent window.
        </p>
      </div>
    );
  }

  const grouped = groupByCourse(items);

  return (
    <div className="space-y-4">
      {[...grouped.entries()].map(([courseName, courseItems]) => (
        <section key={courseName} className="cb-card overflow-hidden">
          <h3 className="border-b-[3px] border-[var(--border)] bg-[var(--card-muted)] px-5 py-3 text-sm font-bold">
            {courseName}
            <span className="ml-2 font-medium text-[var(--color-text-muted)]">
              {courseItems.length}
            </span>
          </h3>
          <ul className="divide-y-[3px] divide-[var(--border)]">
            {courseItems.map((item) => (
              <li key={`${item.assignmentId}-${item.courseId}`}>
                <a
                  href={item.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex cursor-pointer flex-col gap-2 px-5 py-4 transition-colors duration-200 hover:bg-[var(--accent-soft)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-bold">{item.title}</span>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <time
                      className="text-[var(--color-text-muted)]"
                      dateTime={item.dueAt ?? undefined}
                    >
                      {item.dueAtFormatted}
                    </time>
                    {item.reasons.map((r) => (
                      <span
                        key={r}
                        className="rounded-full border-2 border-[var(--danger)] bg-[var(--danger-soft)] px-2 py-0.5 text-xs font-bold text-[var(--danger)]"
                      >
                        {REASON_LABELS[r]}
                      </span>
                    ))}
                    <ExternalLink className="h-4 w-4 text-[var(--color-link)]" />
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
