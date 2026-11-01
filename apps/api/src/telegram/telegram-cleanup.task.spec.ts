import { Logger } from '@nestjs/common';
import { createPgliteDatabase, PgliteDatabase } from '../../test/pglite-database';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaUserRepository } from './repositories/prisma-user-repository';
import { PENDING_RECEIPT_MAX_AGE_MS, TelegramCleanupTask } from './telegram-cleanup.task';

const NOW = new Date('2026-11-01T22:00:00.000Z'); // 03:00 in Dushanbe
const HOUR = 60 * 60 * 1000;
const ago = (ms: number): Date => new Date(NOW.getTime() - ms);

describe('TelegramCleanupTask', () => {
  let db: PgliteDatabase;
  let task: TelegramCleanupTask;
  let accountId: number;
  let ownerId: string;

  const code = (
    codeHash: string,
    expiresAt: Date,
    usedAt: Date | null = null,
  ): { accountId: number; codeHash: string; expiresAt: Date; usedAt: Date | null; createdAt: Date } => ({
    accountId,
    codeHash,
    expiresAt,
    usedAt,
    createdAt: new Date(expiresAt.getTime() - 10 * 60 * 1000),
  });

  function receipt(status: 'PENDING' | 'CONFIRMED' | 'CANCELLED', occurredAt: Date, extra: Record<string, unknown> = {}): Promise<{ id: number }> {
    return db.prisma.telegramTransaction.create({
      data: { accountId, type: 'SALE', amountDirams: 1000, description: 'нон', status, occurredAt, ...extra },
    });
  }

  beforeAll(async () => {
    db = await createPgliteDatabase();
    task = new TelegramCleanupTask(db.prisma);
  }, 60_000);

  beforeEach(async () => {
    await db.reset();
    ownerId = (await db.prisma.user.create({ data: { email: 'owner@example.com', passwordHash: 'x' } })).id;
    const users = new PrismaUserRepository(db.prisma);
    accountId = (await users.upsertFromTelegram({ telegramUserId: 9001, telegramChatId: 9001, firstName: null })).user.id;
  });

  afterAll(async () => {
    await db.close();
  });

  it('deletes only abandoned pending receipts and never confirmed or cancelled ones', async () => {
    const old = ago(PENDING_RECEIPT_MAX_AGE_MS + HOUR);
    const abandoned = await receipt('PENDING', old);
    const recent = await receipt('PENDING', ago(PENDING_RECEIPT_MAX_AGE_MS - HOUR));
    const confirmed = await receipt('CONFIRMED', old, { syncedAt: old });
    const confirmedUnlinked = await receipt('CONFIRMED', old);
    const cancelled = await receipt('CANCELLED', old);

    const result = await task.run(NOW);

    expect(result?.pendingReceipts).toBe(1);
    const left = (await db.prisma.telegramTransaction.findMany({ select: { id: true } })).map((row) => row.id).sort((a, b) => a - b);
    expect(left).toEqual([recent.id, confirmed.id, confirmedUnlinked.id, cancelled.id].sort((a, b) => a - b));
    expect(left).not.toContain(abandoned.id);
  });

  it('deletes long-expired link codes and old link attempts, keeping live ones', async () => {
    await db.prisma.telegramLinkCode.createMany({
      data: [
        code('old', ago(25 * HOUR)),
        code('old-used', ago(48 * HOUR), ago(48 * HOUR + 60 * 1000)),
        code('just-expired', ago(HOUR)),
        code('live', new Date(NOW.getTime() + 5 * 60 * 1000)),
      ],
    });
    await db.prisma.telegramLinkAttempt.createMany({
      data: [
        { userId: ownerId, attemptedAt: ago(HOUR) },
        { userId: ownerId, attemptedAt: ago(60 * 1000) },
      ],
    });

    expect(await task.run(NOW)).toEqual({ pendingReceipts: 0, linkCodes: 2, linkAttempts: 1 });
    expect((await db.prisma.telegramLinkCode.findMany({ orderBy: { id: 'asc' } })).map((row) => row.codeHash)).toEqual(['just-expired', 'live']);
    expect(await db.prisma.telegramLinkAttempt.count()).toBe(1);
  });

  it('is safe to run again and logs a failure without throwing', async () => {
    await receipt('PENDING', ago(PENDING_RECEIPT_MAX_AGE_MS + HOUR));
    await task.run(NOW);
    expect(await task.run(NOW)).toEqual({ pendingReceipts: 0, linkCodes: 0, linkAttempts: 0 });

    const errorLog = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const broken = new TelegramCleanupTask({
      telegramTransaction: { deleteMany: () => Promise.reject(new Error('connection lost')) },
      telegramLinkCode: { deleteMany: () => Promise.resolve({ count: 0 }) },
      telegramLinkAttempt: { deleteMany: () => Promise.resolve({ count: 0 }) },
    } as unknown as PrismaService);
    await expect(broken.run(NOW)).resolves.toBeNull();
    expect(errorLog).toHaveBeenCalledWith('Telegram cleanup failed: Error');
    errorLog.mockRestore();
  });
});
