import { CheckCircle2, ExternalLink } from "lucide-react";
import type { DueTomorrowItem } from "@/lib/canvas/types";

interface DueTomorrowListProps {
  items: DueTomorrowItem[];
  tomorrowDate: string;
}

function groupByCourse(
  items: DueTomorrowItem[]
): Map<string, DueTomorrowItem[]> {
  const groups = new Map<string, DueTomorrowItem[]>();
  for (const item of items) {
    const list = groups.get(item.courseName) ?? [];
    list.push(item);
    groups.set(item.courseName, list);
  }
  return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

const typeLabels: Record<string, string> = {
  assignment: "Assignment",
  quiz: "Quiz",
  discussion_topic: "Discussion",
  planner_note: "Note",
};

export default function DueTomorrowList({
  items,
  tomorrowDate,
}: DueTomorrowListProps) {
  if (items.length === 0) {
    return (
      <div className="cb-card flex flex-col items-center px-6 py-12 text-center">
        <span
          className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]"
          aria-hidden
        >
          <CheckCircle2 className="h-7 w-7" strokeWidth={2.5} />
        </span>
        <p className="font-bold text-[var(--color-text)]">Nothing due tomorrow</p>
        <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
          Enjoy the breather — or get ahead on later work ({tomorrowDate}).
        </p>
      </div>
    );
  }

  const grouped = groupByCourse(items);

  return (
    <div className="space-y-4">
      {[...grouped.entries()].map(([courseName, courseItems]) => (
        <section key={courseName} className="cb-card overflow-hidden">
          <h3 className="border-b-[3px] border-[var(--border)] bg-[var(--card-muted)] px-5 py-3 text-sm font-bold text-[var(--color-text)]">
            {courseName}
            <span className="ml-2 font-medium text-[var(--color-text-muted)]">
              {courseItems.length} item{courseItems.length === 1 ? "" : "s"}
            </span>
          </h3>
          <ul className="divide-y-[3px] divide-[var(--border)]">
            {courseItems.map((item) => (
              <li key={`${item.courseId}-${item.title}-${item.dueAt}`}>
                <a
                  href={item.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex cursor-pointer flex-col gap-2 px-5 py-4 transition-colors duration-200 hover:bg-[var(--accent-soft)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-[var(--color-text)]">
                      {item.title}
                    </span>
                    <span className="ml-2 inline-flex rounded-full border-2 border-[var(--border)] bg-[var(--accent-soft)] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[var(--color-canvas-red)]">
                      {typeLabels[item.plannableType] ?? item.plannableType}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 text-sm font-medium text-[var(--color-text-muted)]">
                    <time dateTime={item.dueAt ?? undefined}>
                      {item.dueAtFormatted}
                    </time>
                    {item.missing && (
                      <span className="rounded-full border-2 border-[var(--danger)] bg-[var(--danger-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--danger)]">
                        Missing
                      </span>
                    )}
                    {item.late && (
                      <span className="rounded-full border-2 border-[var(--warning)] bg-[var(--warning-soft)] px-2.5 py-0.5 text-xs font-bold text-[#854d0e]">
                        Late
                      </span>
                    )}
                    <ExternalLink
                      className="h-4 w-4 text-[var(--color-link)]"
                      aria-hidden
                    />
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
