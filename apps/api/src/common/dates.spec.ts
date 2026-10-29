import { formatCalendarDate, isCalendarDate, parseCalendarDate, todayInBusinessTimeZone } from './dates';

describe('calendar dates', () => {
  it.each(['2026-01-31', '2024-02-29', '2000-12-01'])('accepts %p', (value) => {
    expect(isCalendarDate(value)).toBe(true);
    expect(formatCalendarDate(parseCalendarDate(value))).toBe(value);
  });

  it.each([
    '2026-02-30',
    '2025-02-29',
    '2026-13-01',
    '2026-00-10',
    '2026-1-5',
    '2026-01-01T00:00:00Z',
    '01.02.2026',
    '',
    20260101,
    null,
  ])('rejects %p', (value) => {
    expect(isCalendarDate(value)).toBe(false);
  });

  it('refuses to parse an invalid date', () => {
    expect(() => parseCalendarDate('2026-02-30')).toThrow(RangeError);
  });

  it('computes today in Tajikistan (UTC+5)', () => {
    expect(todayInBusinessTimeZone(new Date('2026-03-10T18:59:59Z'))).toBe('2026-03-10');
    expect(todayInBusinessTimeZone(new Date('2026-03-10T19:00:00Z'))).toBe('2026-03-11');
  });
});
