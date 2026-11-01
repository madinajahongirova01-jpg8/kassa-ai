const OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getTodayRange(now: Date = new Date()): { from: Date; to: Date } {
  const local = now.getTime() + OFFSET_MS;
  const startLocal = Math.floor(local / DAY_MS) * DAY_MS;
  const from = new Date(startLocal - OFFSET_MS);
  return { from, to: new Date(from.getTime() + DAY_MS) };
}

export function getDushanbeDate(now: Date = new Date()): string {
  return new Date(now.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

export function getDushanbeHour(now: Date = new Date()): number {
  return new Date(now.getTime() + OFFSET_MS).getUTCHours();
}

/** Calendar date ("YYYY-MM-DD") a number of days after another one. */
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}