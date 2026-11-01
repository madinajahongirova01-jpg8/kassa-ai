import { createPgliteDatabase, PgliteDatabase } from '../../../test/pglite-database';
import { hashCode } from '../bot/services/link-code';
import { LinkService } from '../bot/services/link-service';
import { PrismaLinkRepository, TelegramLinkConflictError } from './prisma-link-repository';
import { PrismaUserRepository } from './prisma-user-repository';

// Codes are created at the real current time, so the tested moments are relative to it.
const NOW = new Date(Date.now() + 1000);
const IN_10_MIN = new Date(NOW.getTime() + 10 * 60 * 1000);

describe('PrismaLinkRepository', () => {
  let db: PgliteDatabase;
  let links: PrismaLinkRepository;
  let users: PrismaUserRepository;
  let ownerA: string;
  let ownerB: string;

  async function kassaUser(email: string): Promise<string> {
    return (await db.prisma.user.create({ data: { email, passwordHash: 'x' } })).id;
  }

  async function telegramAccount(telegramUserId: number): Promise<number> {
    return (await users.upsertFromTelegram({ telegramUserId, telegramChatId: telegramUserId, firstName: null })).user.id;
  }

  async function accountRow(id: number): Promise<{ userId: string | null; linkedAt: Date | null }> {
    return db.prisma.telegramAccount.findUniqueOrThrow({ where: { id }, select: { userId: true, linkedAt: true } });
  }

  beforeAll(async () => {
    db = await createPgliteDatabase();
    links = new PrismaLinkRepository(db.prisma);
    users = new PrismaUserRepository(db.prisma);
  }, 60_000);

  beforeEach(async () => {
    await db.reset();
    ownerA = await kassaUser('a@example.com');
    ownerB = await kassaUser('b@example.com');
  });

  afterAll(async () => {
    await db.close();
  });

  it('stores only the hash and voids the earlier unused code of the same account', async () => {
    const account = await telegramAccount(1001);
    await links.createCode(account, hashCode('AAAA2222'), IN_10_MIN);
    await links.createCode(account, hashCode('BBBB3333'), IN_10_MIN);

    const rows = await db.prisma.telegramLinkCode.findMany({ orderBy: { id: 'asc' } });
    expect(rows.map((row) => row.codeHash)).toEqual([hashCode('AAAA2222'), hashCode('BBBB3333')]);
    expect(rows.some((row) => row.codeHash.includes('AAAA'))).toBe(false);
    expect(rows[0].usedAt).not.toBeNull();
    expect(rows[1].usedAt).toBeNull();
    expect(await links.consume(hashCode('AAAA2222'), ownerA, NOW)).toBeNull();
  });

  it('links the account on the first use of a valid code and rejects the second use', async () => {
    const account = await telegramAccount(1001);
    await links.createCode(account, hashCode('AAAA2222'), IN_10_MIN);

    expect(await links.consume(hashCode('AAAA2222'), ownerA, NOW)).toBe(account);
    expect(await accountRow(account)).toEqual({ userId: ownerA, linkedAt: NOW });

    expect(await links.consume(hashCode('AAAA2222'), ownerB, NOW)).toBeNull();
    expect((await accountRow(account)).userId).toBe(ownerA);
  });

  it('rejects an expired code, including exactly at the expiry moment', async () => {
    const account = await telegramAccount(1001);
    await links.createCode(account, hashCode('AAAA2222'), IN_10_MIN);

    expect(await links.consume(hashCode('AAAA2222'), ownerA, IN_10_MIN)).toBeNull();
    expect(await links.consume(hashCode('AAAA2222'), ownerA, new Date(IN_10_MIN.getTime() + 1))).toBeNull();
    expect((await accountRow(account)).userId).toBeNull();
  });

  it('rejects an unknown code', async () => {
    await telegramAccount(1001);
    expect(await links.consume(hashCode('ZZZZ9999'), ownerA, NOW)).toBeNull();
  });

  it('rejects a code whose chat was stopped, and /stop voids unused codes', async () => {
    const account = await telegramAccount(1001);
    await links.createCode(account, hashCode('AAAA2222'), IN_10_MIN);
    await users.setStatus(1001, 'stopped');
    await users.upsertFromTelegram({ telegramUserId: 1001, telegramChatId: 1001, firstName: null });

    expect(await links.consume(hashCode('AAAA2222'), ownerA, NOW)).toBeNull();
    expect((await accountRow(account)).userId).toBeNull();
  });

  it('refuses a second Telegram account for the same Kassa user and keeps that code usable', async () => {
    const first = await telegramAccount(1001);
    const second = await telegramAccount(1002);
    await links.createCode(first, hashCode('AAAA2222'), IN_10_MIN);
    await links.createCode(second, hashCode('BBBB3333'), IN_10_MIN);
    await links.consume(hashCode('AAAA2222'), ownerA, NOW);

    await expect(links.consume(hashCode('BBBB3333'), ownerA, NOW)).rejects.toEqual(
      new TelegramLinkConflictError('kassa-user-linked'),
    );

    expect((await accountRow(first)).userId).toBe(ownerA);
    expect((await accountRow(second)).userId).toBeNull();
    expect((await db.prisma.telegramLinkCode.findUniqueOrThrow({ where: { codeHash: hashCode('BBBB3333') } })).usedAt).toBeNull();
    expect(await links.consume(hashCode('BBBB3333'), ownerB, NOW)).toBe(second);
  });

  it('refuses to move a linked Telegram account to another Kassa user', async () => {
    const account = await telegramAccount(1001);
    await links.createCode(account, hashCode('AAAA2222'), IN_10_MIN);
    await links.consume(hashCode('AAAA2222'), ownerA, NOW);
    await links.createCode(account, hashCode('BBBB3333'), IN_10_MIN);

    await expect(links.consume(hashCode('BBBB3333'), ownerB, NOW)).rejects.toEqual(
      new TelegramLinkConflictError('telegram-account-linked'),
    );

    expect((await accountRow(account)).userId).toBe(ownerA);
    expect((await db.prisma.telegramLinkCode.findUniqueOrThrow({ where: { codeHash: hashCode('BBBB3333') } })).usedAt).toBeNull();
  });

  it('accepts linking the same pair again', async () => {
    const account = await telegramAccount(1001);
    await links.createCode(account, hashCode('AAAA2222'), IN_10_MIN);
    await links.consume(hashCode('AAAA2222'), ownerA, NOW);
    await links.createCode(account, hashCode('BBBB3333'), IN_10_MIN);

    expect(await links.consume(hashCode('BBBB3333'), ownerA, NOW)).toBe(account);
    expect((await accountRow(account)).userId).toBe(ownerA);
  });

  it('maps a concurrent unique-link violation to a conflict', async () => {
    const first = await telegramAccount(1001);
    const second = await telegramAccount(1002);
    await links.createCode(second, hashCode('BBBB3333'), IN_10_MIN);
    await db.prisma.telegramAccount.update({ where: { id: first }, data: { userId: ownerA, linkedAt: NOW } });
    // Simulates the other transaction committing after the "already linked?" check: the check sees
    // nothing, so only the unique index on user_id can stop the second link.
    const realTransaction = db.prisma.$transaction.bind(db.prisma) as (fn: (tx: object) => Promise<unknown>) => Promise<unknown>;
    const spy = jest.spyOn(db.prisma, '$transaction').mockImplementation(((fn: (tx: object) => Promise<unknown>) =>
      realTransaction((tx) => {
        const hideLinks = (delegate: object): object =>
          new Proxy(delegate, {
            get: (target, property, receiver) =>
              property === 'findFirst' ? () => Promise.resolve(null) : (Reflect.get(target, property, receiver) as unknown),
          });
        return fn(
          new Proxy(tx, {
            get: (target, property, receiver) => {
              const value = Reflect.get(target, property, receiver) as unknown;
              return property === 'telegramAccount' ? hideLinks(value as object) : value;
            },
          }),
        );
      })) as unknown as typeof db.prisma.$transaction);

    try {
      await expect(links.consume(hashCode('BBBB3333'), ownerA, NOW)).rejects.toEqual(
        new TelegramLinkConflictError('kassa-user-linked'),
      );
    } finally {
      spy.mockRestore();
    }
    expect((await accountRow(second)).userId).toBeNull();
    expect((await db.prisma.telegramLinkCode.findUniqueOrThrow({ where: { codeHash: hashCode('BBBB3333') } })).usedAt).toBeNull();
  });

  it('lets only one of two concurrent attempts consume the same code', async () => {
    const account = await telegramAccount(1001);
    await links.createCode(account, hashCode('AAAA2222'), IN_10_MIN);

    const results = await Promise.all([
      links.consume(hashCode('AAAA2222'), ownerA, NOW),
      links.consume(hashCode('AAAA2222'), ownerB, NOW),
    ]);

    expect(results.filter((result) => result !== null)).toEqual([account]);
    const linkedTo = (await accountRow(account)).userId;
    expect(linkedTo === ownerA || linkedTo === ownerB).toBe(true);
    expect(await db.prisma.telegramAccount.count({ where: { userId: { not: null } } })).toBe(1);
  });

  it('works end to end through the unchanged LinkService, with the formatted code', async () => {
    await telegramAccount(1001);
    const service = new LinkService(users, links);
    const created = await service.createCode(1001);
    expect(created).not.toBeNull();

    const accountId = await service.consumeCode(created!.code.toLowerCase(), ownerA);
    expect(accountId).not.toBeNull();
    expect(await service.consumeCode(created!.code, ownerA)).toBeNull();
    expect(await service.consumeCode('not-a-code', ownerA)).toBeNull();
  });
});
