const DAY_MS = 24 * 60 * 60 * 1000;

// Tasks and calendar store UTC (CLAUDE.md), so their demo dates are UTC midnights.
export function utcDaysFrom(today: Date, offset: number): Date {
  const midnight = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return new Date(midnight + offset * DAY_MS);
}

const jakartaDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" });

// Health and journal use the owner's timezone; a script has no `tz` cookie, so the app default applies.
export function jakartaDate(today: Date, offset: number): string {
  return jakartaDay.format(new Date(today.getTime() + offset * DAY_MS));
}
