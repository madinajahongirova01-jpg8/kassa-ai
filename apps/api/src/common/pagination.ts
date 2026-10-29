import { BadRequestException } from '@nestjs/common';
import { isCalendarDate } from './dates';

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export interface Page<T> {
  items: T[];
  /** Pass back as `cursor` to get the next page; null on the last page. */
  nextCursor: string | null;
}

/**
 * Position of the last returned row in lists ordered by (date desc, createdAt desc, id desc).
 * The order is total, so pages never skip or repeat rows even when many rows share a date.
 */
export interface KeysetCursor {
  date: string;
  createdAt: Date;
  id: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function encodeCursor(cursor: KeysetCursor): string {
  return Buffer.from(`${cursor.date}|${cursor.createdAt.toISOString()}|${cursor.id}`, 'utf8').toString('base64url');
}

export function decodeCursor(value: string): KeysetCursor {
  const [date, createdAt, id, ...rest] = Buffer.from(value, 'base64url').toString('utf8').split('|');
  const timestamp = new Date(createdAt ?? '');
  if (rest.length > 0 || !isCalendarDate(date) || Number.isNaN(timestamp.getTime()) || !UUID_PATTERN.test(id ?? '')) {
    throw new BadRequestException({ message: 'Validation failed', details: ['cursor is invalid'] });
  }
  return { date, createdAt: timestamp, id };
}

/** Splits `limit + 1` fetched rows into a page and the cursor of its last row. */
export function toPage<R, T>(rows: R[], limit: number, cursorOf: (row: R) => KeysetCursor, map: (row: R) => T): Page<T> {
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  return {
    items: pageRows.map(map),
    nextCursor: hasMore ? encodeCursor(cursorOf(pageRows[pageRows.length - 1])) : null,
  };
}
