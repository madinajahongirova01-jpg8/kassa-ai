// Calendar dates (debt and payment days) are exchanged as "YYYY-MM-DD" and stored as PostgreSQL DATE.
export const BUSINESS_TIME_ZONE = 'Asia/Dushanbe';

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const businessDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const match = CALENDAR_DATE_PATTERN.exec(value);
  if (match === null) {
    return false;
  }
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function parseCalendarDate(value: string): Date {
  if (!isCalendarDate(value)) {
    throw new RangeError('Invalid calendar date, expected YYYY-MM-DD');
  }
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today's date in Tajikistan, used as the default payment day and the upper bound for past events. */
export function todayInBusinessTimeZone(now: Date = new Date()): string {
  return businessDateFormat.format(now);
}
