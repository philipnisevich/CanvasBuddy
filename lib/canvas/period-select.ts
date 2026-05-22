export interface DatedPeriod {
  id: number;
  startAt: string | null;
  endAt: string | null;
}

/** Pick the period that contains today, or the most recent past period. */
export function pickCurrentDatedId(
  periods: DatedPeriod[],
  today: Date = new Date()
): number | null {
  if (periods.length === 0) return null;

  const t = today.getTime();
  const containing = periods.find((p) => {
    const start = p.startAt ? new Date(p.startAt).getTime() : null;
    const end = p.endAt ? new Date(p.endAt).getTime() : null;
    if (start != null && t < start) return false;
    if (end != null && t > end) return false;
    return true;
  });
  if (containing) return containing.id;

  const past = periods
    .filter((p) => p.endAt && new Date(p.endAt).getTime() <= t)
    .sort(
      (a, b) =>
        new Date(b.endAt!).getTime() - new Date(a.endAt!).getTime()
    );
  if (past[0]) return past[0].id;

  const future = periods
    .filter((p) => p.startAt && new Date(p.startAt).getTime() > t)
    .sort(
      (a, b) =>
        new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime()
    );
  return future[0]?.id ?? periods[0]?.id ?? null;
}
