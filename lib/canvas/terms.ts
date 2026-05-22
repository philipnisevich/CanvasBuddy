import { pickCurrentDatedId } from "./period-select";
import type { CanvasCourse, EnrollmentTerm } from "./types";

export function buildTermsFromCourses(courses: CanvasCourse[]): EnrollmentTerm[] {
  const byId = new Map<number, EnrollmentTerm>();

  for (const course of courses) {
    const term = course.term;
    const termId = term?.id ?? course.enrollment_term_id;
    if (termId == null) continue;

    const existing = byId.get(termId);
    if (existing) {
      existing.courseCount += 1;
      continue;
    }

    byId.set(termId, {
      id: termId,
      name: term?.name ?? `Term ${termId}`,
      startAt: term?.start_at ?? null,
      endAt: term?.end_at ?? null,
      courseCount: 1,
    });
  }

  return [...byId.values()].sort((a, b) => {
    const aEnd = a.endAt ? new Date(a.endAt).getTime() : 0;
    const bEnd = b.endAt ? new Date(b.endAt).getTime() : 0;
    return bEnd - aEnd;
  });
}

export function getCurrentTermId(
  terms: EnrollmentTerm[],
  today: Date = new Date()
): number | null {
  return pickCurrentDatedId(
    terms.map((t) => ({
      id: t.id,
      startAt: t.startAt,
      endAt: t.endAt,
    })),
    today
  );
}

export function getPriorTermId(
  terms: EnrollmentTerm[],
  currentTermId: number | null
): number | null {
  if (terms.length < 2) return null;
  const idx = terms.findIndex((t) => t.id === currentTermId);
  if (idx >= 0 && idx + 1 < terms.length) {
    return terms[idx + 1].id;
  }
  if (currentTermId == null) return terms[1]?.id ?? null;
  const others = terms.filter((t) => t.id !== currentTermId);
  return others[0]?.id ?? null;
}

export function filterCoursesByTerm(
  courses: CanvasCourse[],
  termId: number
): CanvasCourse[] {
  return courses.filter(
    (c) => (c.enrollment_term_id ?? c.term?.id) === termId
  );
}

export function isPriorTerm(
  term: EnrollmentTerm,
  currentTermId: number | null
): boolean {
  return currentTermId != null && term.id !== currentTermId;
}
