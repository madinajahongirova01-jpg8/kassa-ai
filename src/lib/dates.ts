// Calendar dates are "YYYY-MM-DD" strings in the business time zone, like in the API.
export const BUSINESS_TIME_ZONE = "Asia/Dushanbe";

const DAY_MS = 24 * 60 * 60 * 1000;

const dateFormat = new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const timeFormat = new Intl.DateTimeFormat("en-GB", { timeZone: BUSINESS_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export function businessToday(now: Date = new Date()) {
  return dateFormat.format(now);
}

/** "HH:MM" of a timestamp in the business time zone. */
export function businessTime(timestamp: string | Date) {
  return timeFormat.format(new Date(timestamp));
}

function utc(date: string) {
  return Date.parse(`${date}T00:00:00Z`);
}

export function addDays(date: string, days: number) {
  return new Date(utc(date) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string) {
  return Math.round((utc(to) - utc(from)) / DAY_MS);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayIndex(date: string) {
  return new Date(utc(date)).getUTCDay();
}

export function monthKey(date: string) {
  return date.slice(0, 7);
}

/** First day of the month `offset` months away from the month of `date`. */
export function monthStart(date: string, offset = 0) {
  const [year, month] = date.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1 + offset, 1));
  return start.toISOString().slice(0, 10);
}

export function monthEnd(date: string) {
  return addDays(monthStart(date, 1), -1);
}

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && MONTH_PATTERN.test(value);
}
