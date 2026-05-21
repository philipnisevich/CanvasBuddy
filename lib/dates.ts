const ymdFormatter = (timezone: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

/** Calendar yyyy-mm-dd for an instant in the given IANA timezone. */
export function getYmdInTimezone(isoOrDate: string | Date, timezone: string): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return ymdFormatter(timezone).format(d);
}

/** Returns yyyy-mm-dd for the calendar day after today in the given IANA timezone. */
export function getTomorrowYmd(timezone: string): string {
  const fmt = ymdFormatter(timezone);
  const now = new Date();
  const today = fmt.format(now);

  let probe = new Date(now.getTime());
  for (let i = 0; i < 72; i++) {
    probe = new Date(probe.getTime() + 60 * 60 * 1000);
    const ymd = fmt.format(probe);
    if (ymd !== today) return ymd;
  }

  const [year, month, day] = today.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1, 12));
  return fmt.format(next);
}

export function getDefaultTimezone(): string {
  return process.env.TZ || "America/New_York";
}

export function formatDueAt(iso: string | null, timezone: string): string {
  if (!iso) return "No due time";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
