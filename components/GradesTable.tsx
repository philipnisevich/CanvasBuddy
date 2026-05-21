import { ExternalLink } from "lucide-react";
import type { CourseGrade } from "@/lib/canvas/types";

interface GradesTableProps {
  grades: CourseGrade[];
}

function gradeTone(score: number | null, hidden: boolean): string {
  if (hidden || score === null) return "font-medium text-[var(--color-text-muted)]";
  if (score >= 90) return "font-bold text-[var(--success)]";
  if (score >= 70) return "font-bold text-[var(--color-text)]";
  return "font-bold text-[#854d0e]";
}

export default function GradesTable({ grades }: GradesTableProps) {
  if (grades.length === 0) {
    return (
      <div className="cb-card px-6 py-10 text-center font-medium text-[var(--color-text-muted)]">
        No active courses found in Canvas.
      </div>
    );
  }

  return (
    <div className="cb-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b-[3px] border-[var(--border)] bg-[var(--card-muted)] text-[var(--color-text-muted)]">
              <th className="px-5 py-3 font-bold">Course</th>
              <th className="px-5 py-3 font-bold">Score</th>
              <th className="px-5 py-3 font-bold">Letter</th>
              <th className="px-5 py-3 font-bold">
                <span className="sr-only">Open in Canvas</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade) => (
              <tr
                key={grade.courseId}
                className="border-b-[3px] border-[var(--border)] last:border-0 transition-colors duration-200 hover:bg-[var(--accent-soft)]/40"
              >
                <td className="px-5 py-4">
                  <div className="font-bold text-[var(--color-text)]">
                    {grade.courseName}
                  </div>
                  {grade.courseCode && (
                    <div className="text-xs font-medium text-[var(--color-text-muted)]">
                      {grade.courseCode}
                    </div>
                  )}
                </td>
                <td
                  className={`px-5 py-4 ${gradeTone(grade.currentScore, grade.hidden)}`}
                >
                  {grade.hidden ? (
                    "Hidden"
                  ) : grade.currentScore !== null ? (
                    `${grade.currentScore.toFixed(1)}%`
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-5 py-4">
                  {grade.hidden ? (
                    <span className="text-[var(--color-text-muted)]">—</span>
                  ) : (
                    <span className="inline-flex min-w-[2rem] justify-center rounded-[var(--radius)] border-2 border-[var(--border)] bg-[var(--card)] px-2 py-0.5 font-bold text-[var(--color-text)]">
                      {grade.currentGrade ?? "—"}
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  {grade.gradesUrl && (
                    <a
                      href={grade.gradesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cb-link inline-flex cursor-pointer items-center gap-1 text-sm"
                    >
                      Canvas
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
