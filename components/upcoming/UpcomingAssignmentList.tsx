import { ExternalLink } from "lucide-react";
import type { AssignmentContextItem } from "@/lib/canvas/types";

function groupByCourse(
  items: AssignmentContextItem[]
): Map<string, AssignmentContextItem[]> {
  const groups = new Map<string, AssignmentContextItem[]>();
  for (const item of items) {
    const list = groups.get(item.courseName) ?? [];
    list.push(item);
    groups.set(item.courseName, list);
  }
  return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export default function UpcomingAssignmentList({
  items,
  emptyMessage,
}: {
  items: AssignmentContextItem[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <div className="cb-card px-6 py-10 text-center">
        <p className="font-medium text-[var(--color-text-muted)]">
          {emptyMessage}
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
                  <span className="font-bold text-[var(--color-text)]">
                    {item.title}
                  </span>
                  <span className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)]">
                    <time dateTime={item.dueAt ?? undefined}>
                      {item.dueAtFormatted}
                    </time>
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
