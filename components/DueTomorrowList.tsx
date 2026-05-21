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

export default function DueTomorrowList({
  items,
  tomorrowDate,
}: DueTomorrowListProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-8 text-center text-[var(--muted)]">
        Nothing due tomorrow ({tomorrowDate}).
      </p>
    );
  }

  const grouped = groupByCourse(items);

  return (
    <div className="space-y-4">
      {[...grouped.entries()].map(([courseName, courseItems]) => (
        <section
          key={courseName}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
        >
          <h3 className="border-b border-[var(--border)] bg-slate-50 px-4 py-2 text-sm font-semibold dark:bg-slate-800/50">
            {courseName}
          </h3>
          <ul className="divide-y divide-[var(--border)]">
            {courseItems.map((item) => (
              <li key={`${item.courseId}-${item.title}-${item.dueAt}`}>
                <a
                  href={item.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-1 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="font-medium">{item.title}</span>
                    <span className="ml-2 text-xs capitalize text-[var(--muted)]">
                      {item.plannableType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <span>{item.dueAtFormatted}</span>
                    {item.missing && (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        Missing
                      </span>
                    )}
                    {item.late && (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        Late
                      </span>
                    )}
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
