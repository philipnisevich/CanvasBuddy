export interface CourseMatchCandidate {
  id: number;
  name: string;
  courseCode?: string;
}

/** Score how well a course matches a search hint (higher is better). */
export function scoreCourseMatch(
  course: CourseMatchCandidate,
  hint: string
): number {
  const q = hint.trim().toLowerCase();
  if (!q) return 0;

  const name = course.name.toLowerCase();
  const code = (course.courseCode ?? "").toLowerCase();
  const combined = `${name} ${code}`.trim();

  if (name === q || code === q) return 100;
  if (name.includes(q) || code.includes(q)) return 80;
  if (combined.includes(q)) return 60;

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const allIn = tokens.every((t) => combined.includes(t));
    if (allIn) return 50;
  }

  return 0;
}

export function rankCoursesByHint(
  courses: CourseMatchCandidate[],
  hint: string
): CourseMatchCandidate[] {
  return [...courses]
    .map((c) => ({ course: c, score: scoreCourseMatch(c, hint) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.course);
}
