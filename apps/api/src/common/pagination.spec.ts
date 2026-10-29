import { BadRequestException } from '@nestjs/common';
import { decodeCursor, encodeCursor, toPage } from './pagination';

const CURSOR = {
  date: '2026-01-15',
  createdAt: new Date('2026-01-15T10:20:30.456Z'),
  id: '5d2e8c3a-1f4b-4a6d-8e9f-0a1b2c3d4e5f',
};

describe('pagination', () => {
  it('round-trips a cursor', () => {
    expect(decodeCursor(encodeCursor(CURSOR))).toEqual(CURSOR);
  });

  it.each([
    ['garbage', 'not-a-cursor'],
    ['an invalid date', Buffer.from(`2026-02-30|${CURSOR.createdAt.toISOString()}|${CURSOR.id}`).toString('base64url')],
    ['an invalid id', Buffer.from(`2026-01-15|${CURSOR.createdAt.toISOString()}|42`).toString('base64url')],
    ['extra parts', `${encodeCursor(CURSOR)}${Buffer.from('|x').toString('base64url')}`],
  ])('rejects %s with 400', (_case, value) => {
    expect(() => decodeCursor(value)).toThrow(BadRequestException);
  });

  it('returns a cursor only when more rows exist', () => {
    const rows = [1, 2, 3];
    const cursorOf = (n: number): typeof CURSOR => ({ ...CURSOR, id: `5d2e8c3a-1f4b-4a6d-8e9f-0a1b2c3d4e5${n}` });

    const first = toPage(rows, 2, cursorOf, (n) => n * 10);
    expect(first.items).toEqual([10, 20]);
    expect(decodeCursor(first.nextCursor ?? '').id).toBe(cursorOf(2).id);

    expect(toPage(rows, 3, cursorOf, (n) => n)).toEqual({ items: [1, 2, 3], nextCursor: null });
  });
});
