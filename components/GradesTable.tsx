import type { CourseGrade } from "@/lib/canvas/types";

interface GradesTableProps {
  grades: CourseGrade[];
}

export default function GradesTable({ grades }: GradesTableProps) {
  if (grades.length === 0) {
    return (
      <p className="text-[var(--muted)]">No active courses found.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--muted)]">
            <th className="px-4 py-3 font-medium">Course</th>
            <th className="px-4 py-3 font-medium">Score</th>
            <th className="px-4 py-3 font-medium">Grade</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {grades.map((grade) => (
            <tr
              key={grade.courseId}
              className="border-b border-[var(--border)] last:border-0"
            >
              <td className="px-4 py-3">
                <div className="font-medium">{grade.courseName}</div>
                {grade.courseCode && (
                  <div className="text-xs text-[var(--muted)]">
                    {grade.courseCode}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                {grade.hidden ? (
                  <span className="text-[var(--muted)]">Grades hidden</span>
                ) : grade.currentScore !== null ? (
                  `${grade.currentScore.toFixed(1)}%`
                ) : (
                  <span className="text-[var(--muted)]">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                {grade.hidden ? (
                  <span className="text-[var(--muted)]">—</span>
                ) : (
                  (grade.currentGrade ?? "—")
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {grade.gradesUrl && (
                  <a
                    href={grade.gradesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    View in Canvas
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
