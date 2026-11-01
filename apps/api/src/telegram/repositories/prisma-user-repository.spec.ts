import { createPgliteDatabase, PgliteDatabase } from '../../../test/pglite-database';
import { PrismaUserRepository } from './prisma-user-repository';

describe('PrismaUserRepository', () => {
  let db: PgliteDatabase;
  let users: PrismaUserRepository;

  function register(
    telegramUserId: number,
    telegramChatId = telegramUserId,
    firstName: string | null = 'Aziz',
  ): ReturnType<PrismaUserRepository['upsertFromTelegram']> {
    return users.upsertFromTelegram({ telegramUserId, telegramChatId, firstName });
  }

  beforeAll(async () => {
    db = await createPgliteDatabase();
    users = new PrismaUserRepository(db.prisma);
  }, 60_000);

  beforeEach(async () => {
    await db.reset();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('upsertFromTelegram', () => {
    it('creates an active account on first contact and reports it as new', async () => {
      const { user, isNew } = await register(5_000_000_001, 5_000_000_001);

      expect(isNew).toBe(true);
      expect(user).toEqual({
        id: 1,
        telegramUserId: 5_000_000_001,
        telegramChatId: 5_000_000_001,
        firstName: 'Aziz',
        status: 'active',
        language: null,
      });
    });

    it('updates chat and name, reactivates a stopped account and reports it as not new', async () => {
      await register(1001, 1001, 'Aziz');
      await users.setStatus(1001, 'stopped');

      const { user, isNew } = await register(1001, 2002, 'Zafar');

      expect(isNew).toBe(false);
      expect(user).toMatchObject({ id: 1, telegramChatId: 2002, firstName: 'Zafar', status: 'active' });
      expect(await db.prisma.telegramAccount.count()).toBe(1);
    });
  });

  describe('findByTelegramUserId and setLanguage', () => {
    it('returns null for an unknown Telegram user', async () => {
      expect(await users.findByTelegramUserId(404)).toBeNull();
      expect(await users.setLanguage(404, 'ru')).toBeNull();
    });

    it('sets the language of that account only', async () => {
      await register(1001);
      await register(1002);

      expect((await users.setLanguage(1001, 'ru'))?.language).toBe('ru');
      expect((await users.setLanguage(1001, 'en'))?.language).toBe('en');
      expect((await users.findByTelegramUserId(1001))?.language).toBe('en');
      expect((await users.findByTelegramUserId(1002))?.language).toBeNull();
    });
  });

  describe('setStatus', () => {
    it('stopping unlinks only that account from Kassa and voids its unused codes', async () => {
      const ownerA = (await db.prisma.user.create({ data: { email: 'a@example.com', passwordHash: 'x' } })).id;
      const ownerB = (await db.prisma.user.create({ data: { email: 'b@example.com', passwordHash: 'x' } })).id;
      const a = (await register(1001)).user.id;
      const b = (await register(1002)).user.id;
      await db.prisma.telegramAccount.update({ where: { id: a }, data: { userId: ownerA, linkedAt: new Date() } });
      await db.prisma.telegramAccount.update({ where: { id: b }, data: { userId: ownerB, linkedAt: new Date() } });
      await db.prisma.telegramLinkCode.create({ data: { accountId: a, codeHash: 'ha', expiresAt: new Date(Date.now() + 600_000) } });
      await db.prisma.telegramLinkCode.create({ data: { accountId: b, codeHash: 'hb', expiresAt: new Date(Date.now() + 600_000) } });

      expect((await users.setStatus(1001, 'stopped'))?.status).toBe('stopped');

      const rows = await db.prisma.telegramAccount.findMany({ orderBy: { id: 'asc' } });
      expect(rows.map((row) => [row.userId, row.linkedAt === null])).toEqual([
        [null, true],
        [ownerB, false],
      ]);
      const codes = await db.prisma.telegramLinkCode.findMany({ orderBy: { id: 'asc' } });
      expect(codes.map((code) => code.usedAt !== null)).toEqual([true, false]);
    });

    it('activating again does not restore the Kassa link', async () => {
      const owner = (await db.prisma.user.create({ data: { email: 'a@example.com', passwordHash: 'x' } })).id;
      const id = (await register(1001)).user.id;
      await db.prisma.telegramAccount.update({ where: { id }, data: { userId: owner, linkedAt: new Date() } });

      await users.setStatus(1001, 'stopped');
      expect((await users.setStatus(1001, 'active'))?.status).toBe('active');

      expect((await db.prisma.telegramAccount.findUniqueOrThrow({ where: { id } })).userId).toBeNull();
    });

    it('returns null for an unknown Telegram user', async () => {
      expect(await users.setStatus(404, 'stopped')).toBeNull();
    });
  });

  describe('reminders', () => {
    it('lists active accounts not yet reminded on that Dushanbe day', async () => {
      const fresh = (await register(1001)).user.id;
      const yesterday = (await register(1002)).user.id;
      const today = (await register(1003)).user.id;
      await register(1004);
      await users.setStatus(1004, 'stopped');
      await users.claimReminder(yesterday, '2026-10-31');
      await users.claimReminder(today, '2026-11-01');

      const due = await users.listDueForReminder('2026-11-01');

      expect(due.map((user) => user.id)).toEqual([fresh, yesterday]);
    });

    it('gives the reminder of a day to exactly one claim, and again the next day', async () => {
      const id = (await register(1001)).user.id;

      const claims = await Promise.all([users.claimReminder(id, '2026-11-01'), users.claimReminder(id, '2026-11-01')]);
      expect(claims.sort()).toEqual([false, true]);
      expect(await users.claimReminder(id, '2026-11-01')).toBe(false);
      expect(await users.claimReminder(id, '2026-11-02')).toBe(true);
    });

    it('never claims for a stopped account or another account', async () => {
      const id = (await register(1001)).user.id;
      await users.setStatus(1001, 'stopped');

      expect(await users.claimReminder(id, '2026-11-01')).toBe(false);
      expect(await users.claimReminder(id + 100, '2026-11-01')).toBe(false);
    });
  });
});
