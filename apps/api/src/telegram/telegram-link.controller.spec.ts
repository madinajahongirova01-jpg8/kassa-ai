import request from 'supertest';
import { createPgliteApp, PgliteApp } from '../../test/pglite-app';
import { ErrorResponse } from '../common/error-response';
import { LinkService } from './bot/services/link-service';
import { hashCode } from './bot/services/link-code';
import { PrismaLinkRepository } from './repositories/prisma-link-repository';
import { PrismaUserRepository } from './repositories/prisma-user-repository';
import {
  CONFLICT_MESSAGES,
  INVALID_CODE_MESSAGE,
  LINK_ATTEMPT_LIMIT,
  LINK_ATTEMPT_WINDOW_MS,
  TOO_MANY_ATTEMPTS_MESSAGE,
} from './telegram-link.service';

const PASSWORD = 'correct-horse-battery';
// Telegram ids are large on purpose: they must never appear in a response body.
const TELEGRAM_A = 7_100_200_301;
const TELEGRAM_B = 7_100_200_302;
const TELEGRAM_C = 7_100_200_303;
const WRONG_CODE = 'ZZZZ-9999';

describe('Telegram linking (HTTP)', () => {
  let ctx: PgliteApp;
  let users: PrismaUserRepository;
  let links: LinkService;
  let tokenA: string;
  let tokenB: string;
  let ownerA: string;
  let ownerB: string;

  function api(): ReturnType<typeof request> {
    return request(ctx.app.getHttpServer());
  }

  async function register(email: string): Promise<{ token: string; id: string }> {
    const response = await api().post('/auth/register').send({ email, password: PASSWORD, businessName: 'Shop' }).expect(201);
    const body = response.body as { accessToken: string; user: { id: string } };
    return { token: body.accessToken, id: body.user.id };
  }

  /** A Telegram chat that sent /start and then /link; returns the code shown in the chat. */
  async function telegramCode(telegramUserId: number): Promise<string> {
    await users.upsertFromTelegram({ telegramUserId, telegramChatId: telegramUserId, firstName: 'Aziz' });
    const created = await links.createCode(telegramUserId);
    return created!.code;
  }

  function link(token: string, code: unknown, ip = '203.0.113.10'): request.Test {
    return api().post('/telegram/link').set('X-Forwarded-For', ip).auth(token, { type: 'bearer' }).send({ code });
  }

  function linkedUserOf(telegramUserId: number): Promise<string | null> {
    return ctx.db.prisma.telegramAccount
      .findUniqueOrThrow({ where: { telegramUserId: BigInt(telegramUserId) }, select: { userId: true } })
      .then((row) => row.userId);
  }

  function expectNoTelegramIds(body: unknown): void {
    const text = JSON.stringify(body);
    expect(text).not.toContain(String(TELEGRAM_A));
    expect(text).not.toContain(String(TELEGRAM_B));
    expect(text).not.toContain(String(TELEGRAM_C));
    expect(text).not.toContain('Aziz');
  }

  beforeAll(async () => {
    ctx = await createPgliteApp();
    users = new PrismaUserRepository(ctx.db.prisma);
    links = new LinkService(users, new PrismaLinkRepository(ctx.db.prisma));
  }, 60_000);

  beforeEach(async () => {
    await ctx.db.reset();
    ({ token: tokenA, id: ownerA } = await register('a@example.com'));
    ({ token: tokenB, id: ownerB } = await register('b@example.com'));
  });

  afterAll(async () => {
    await ctx.close();
  });

  describe('authentication and validation', () => {
    it('requires a signed-in Kassa user for every route', async () => {
      const code = await telegramCode(TELEGRAM_A);
      await api().post('/telegram/link').send({ code }).expect(401);
      await api().post('/telegram/link').auth('not-a-jwt', { type: 'bearer' }).send({ code }).expect(401);
      await api().get('/telegram/link').expect(401);
      await api().delete('/telegram/link').expect(401);
      expect(await linkedUserOf(TELEGRAM_A)).toBeNull();
    });

    it.each([[undefined], [''], ['   '], [12345678], ['A'.repeat(33)]])('rejects code %p with 400 and does not count it', async (code) => {
      const response = await link(tokenA, code).expect(400);
      expect((response.body as ErrorResponse).message).toBe('Validation failed');
      expect(await ctx.db.prisma.telegramLinkAttempt.count()).toBe(0);
    });

    it('rejects unknown fields such as an attempt to pass another user id', async () => {
      const code = await telegramCode(TELEGRAM_A);
      await api().post('/telegram/link').auth(tokenA, { type: 'bearer' }).send({ code, userId: ownerB }).expect(400);
      expect(await linkedUserOf(TELEGRAM_A)).toBeNull();
    });
  });

  describe('linking', () => {
    it('links the Telegram chat to the signed-in user and reports only the status', async () => {
      const code = await telegramCode(TELEGRAM_A);

      const response = await link(tokenA, code).expect(200);

      const body = response.body as { linked: boolean; linkedAt: string };
      expect(Object.keys(body).sort()).toEqual(['linked', 'linkedAt']);
      expect(body.linked).toBe(true);
      expect(Number.isNaN(Date.parse(body.linkedAt))).toBe(false);
      expectNoTelegramIds(body);
      expect(await linkedUserOf(TELEGRAM_A)).toBe(ownerA);
      expect((await api().get('/telegram/link').auth(tokenA, { type: 'bearer' }).expect(200)).body).toEqual(body);
      expect(await ctx.db.prisma.telegramLinkAttempt.count()).toBe(0);
    });

    it('accepts the code in lower case, without the dash and with spaces', async () => {
      const code = await telegramCode(TELEGRAM_A);
      await link(tokenA, ` ${code.toLowerCase().replace('-', ' ')} `).expect(200);
      expect(await linkedUserOf(TELEGRAM_A)).toBe(ownerA);
    });

    it('answers the same 400 for wrong, used, expired and revoked codes', async () => {
      const used = await telegramCode(TELEGRAM_A);
      await link(tokenA, used).expect(200);
      await api().delete('/telegram/link').auth(tokenA, { type: 'bearer' }).expect(204);

      const revokedByNewCode = await telegramCode(TELEGRAM_B);
      await telegramCode(TELEGRAM_B);
      const expired = await telegramCode(TELEGRAM_C);
      await ctx.db.prisma.telegramLinkCode.update({
        where: { codeHash: hashCode(expired.replace('-', '')) },
        data: { createdAt: new Date(Date.now() - 20 * 60_000), expiresAt: new Date(Date.now() - 10 * 60_000) },
      });
      const revokedByStop = await telegramCode(TELEGRAM_A);
      await users.setStatus(TELEGRAM_A, 'stopped');

      const bodies: ErrorResponse[] = [];
      for (const code of [WRONG_CODE, used, expired, revokedByNewCode, revokedByStop]) {
        bodies.push((await link(tokenA, code).expect(400)).body as ErrorResponse);
      }

      expect(bodies.map((body) => body.message)).toEqual(Array(5).fill(INVALID_CODE_MESSAGE));
      expect(bodies.map((body) => body.details)).toEqual([4, 3, 2, 1, 0].map((left) => [`attemptsLeft: ${left}`]));
      bodies.forEach(expectNoTelegramIds);
      expect(await linkedUserOf(TELEGRAM_A)).toBeNull();
      expect(await linkedUserOf(TELEGRAM_B)).toBeNull();
      expect(await linkedUserOf(TELEGRAM_C)).toBeNull();
    });
  });

  describe('rate limit on wrong codes (database)', () => {
    it(`blocks after ${LINK_ATTEMPT_LIMIT} wrong codes, even a correct one, without using it up`, async () => {
      const code = await telegramCode(TELEGRAM_A);
      for (let attempt = 0; attempt < LINK_ATTEMPT_LIMIT; attempt += 1) {
        await link(tokenA, WRONG_CODE).expect(400);
      }

      const response = await link(tokenA, code).expect(429);

      expect(response.body as ErrorResponse).toEqual({
        statusCode: 429,
        error: 'Too Many Requests',
        message: TOO_MANY_ATTEMPTS_MESSAGE,
      });
      expect(await linkedUserOf(TELEGRAM_A)).toBeNull();
      expect(await ctx.db.prisma.telegramLinkCode.count({ where: { usedAt: null } })).toBe(1);
    });

    it('counts per Kassa user: another user is not blocked', async () => {
      for (let attempt = 0; attempt < LINK_ATTEMPT_LIMIT; attempt += 1) {
        await link(tokenA, WRONG_CODE).expect(400);
      }
      await link(tokenA, WRONG_CODE).expect(429);

      const code = await telegramCode(TELEGRAM_B);
      await link(tokenB, code).expect(200);
      expect(await linkedUserOf(TELEGRAM_B)).toBe(ownerB);
    });

    it('forgets wrong attempts older than 15 minutes', async () => {
      const old = new Date(Date.now() - LINK_ATTEMPT_WINDOW_MS - 1000);
      await ctx.db.prisma.telegramLinkAttempt.createMany({
        data: Array.from({ length: LINK_ATTEMPT_LIMIT }, () => ({ userId: ownerA, attemptedAt: old })),
      });
      const code = await telegramCode(TELEGRAM_A);

      await link(tokenA, code).expect(200);
      expect(await ctx.db.prisma.telegramLinkAttempt.count({ where: { userId: ownerA } })).toBe(0);
    });

    it('does not count successful links or conflicts', async () => {
      await link(tokenA, WRONG_CODE).expect(400);
      await link(tokenA, await telegramCode(TELEGRAM_A)).expect(200);
      await link(tokenA, await telegramCode(TELEGRAM_B)).expect(409);

      expect(await ctx.db.prisma.telegramLinkAttempt.count({ where: { userId: ownerA } })).toBe(1);
    });

    it('never lets concurrent wrong attempts exceed the limit', async () => {
      const responses = await Promise.all(Array.from({ length: LINK_ATTEMPT_LIMIT + 3 }, () => link(tokenA, WRONG_CODE)));

      const statuses = responses.map((response) => response.status).sort();
      expect(statuses).toEqual([...Array.from({ length: LINK_ATTEMPT_LIMIT }, () => 400), 429, 429, 429]);
      expect(await ctx.db.prisma.telegramLinkAttempt.count({ where: { userId: ownerA } })).toBe(LINK_ATTEMPT_LIMIT);
    });
  });

  describe('conflicts (409) and one Telegram account per Kassa user', () => {
    it('refuses a second Telegram account for the same Kassa user; the code stays usable', async () => {
      await link(tokenA, await telegramCode(TELEGRAM_A)).expect(200);
      const second = await telegramCode(TELEGRAM_B);

      const response = await link(tokenA, second).expect(409);

      expect((response.body as ErrorResponse).message).toBe(CONFLICT_MESSAGES['kassa-user-linked']);
      expectNoTelegramIds(response.body);
      expect(await linkedUserOf(TELEGRAM_A)).toBe(ownerA);
      expect(await linkedUserOf(TELEGRAM_B)).toBeNull();

      await api().delete('/telegram/link').auth(tokenA, { type: 'bearer' }).expect(204);
      await link(tokenA, second).expect(200);
      expect(await linkedUserOf(TELEGRAM_B)).toBe(ownerA);
    });

    it("refuses to take over a Telegram chat linked to another Kassa user, without revealing who", async () => {
      await link(tokenA, await telegramCode(TELEGRAM_A)).expect(200);
      const code = await links.createCode(TELEGRAM_A);

      const response = await link(tokenB, code!.code).expect(409);

      expect((response.body as ErrorResponse).message).toBe(CONFLICT_MESSAGES['telegram-account-linked']);
      expect(JSON.stringify(response.body)).not.toContain(ownerA);
      expect(JSON.stringify(response.body)).not.toContain('a@example.com');
      expect(await linkedUserOf(TELEGRAM_A)).toBe(ownerA);
    });

    it('lets two concurrent links of one user with two codes produce one link and one 409', async () => {
      const [codeA, codeB] = [await telegramCode(TELEGRAM_A), await telegramCode(TELEGRAM_B)];

      const responses = await Promise.all([link(tokenA, codeA), link(tokenA, codeB)]);

      expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
      expect(await ctx.db.prisma.telegramAccount.count({ where: { userId: ownerA } })).toBe(1);
    });
  });

  describe('status, unlinking and isolation', () => {
    it("shows each user only their own status and unlinks only the caller's link", async () => {
      await link(tokenA, await telegramCode(TELEGRAM_A)).expect(200);

      expect((await api().get('/telegram/link').auth(tokenB, { type: 'bearer' }).expect(200)).body).toEqual({
        linked: false,
        linkedAt: null,
      });
      await api().delete('/telegram/link').auth(tokenB, { type: 'bearer' }).expect(204);
      expect(await linkedUserOf(TELEGRAM_A)).toBe(ownerA);

      await api().delete('/telegram/link').auth(tokenA, { type: 'bearer' }).expect(204);
      expect(await linkedUserOf(TELEGRAM_A)).toBeNull();
      expect((await api().get('/telegram/link').auth(tokenA, { type: 'bearer' }).expect(200)).body).toEqual({
        linked: false,
        linkedAt: null,
      });
      await api().delete('/telegram/link').auth(tokenA, { type: 'bearer' }).expect(204);
    });

    it('keeps the Telegram chat active after unlinking from the website', async () => {
      await link(tokenA, await telegramCode(TELEGRAM_A)).expect(200);
      await api().delete('/telegram/link').auth(tokenA, { type: 'bearer' }).expect(204);

      expect((await users.findByTelegramUserId(TELEGRAM_A))?.status).toBe('active');
    });
  });
});

describe('Telegram linking per-IP limit (login pattern)', () => {
  const LIMIT = 3;
  let ctx: PgliteApp;
  let token: string;

  beforeAll(async () => {
    ctx = await createPgliteApp({ errorMessage: TOO_MANY_ATTEMPTS_MESSAGE, throttlers: [{ limit: LIMIT, ttl: 60_000 }] });
    // Registration has its own counter: throttling is tracked per route.
    const response = await request(ctx.app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'ip@example.com', password: PASSWORD, businessName: 'Shop' })
      .expect(201);
    token = (response.body as { accessToken: string }).accessToken;
  }, 60_000);

  afterAll(async () => {
    await ctx.close();
  });

  it('answers 429 from the same IP once the limit is used, while another IP still passes', async () => {
    const post = (ip: string): request.Test =>
      request(ctx.app.getHttpServer())
        .post('/telegram/link')
        .set('X-Forwarded-For', ip)
        .auth(token, { type: 'bearer' })
        .send({ code: WRONG_CODE });

    for (let attempt = 0; attempt < LIMIT; attempt += 1) {
      await post('203.0.113.10').expect(400);
    }
    const blocked = await post('203.0.113.10').expect(429);

    expect(blocked.body as ErrorResponse).toEqual({ statusCode: 429, error: 'Too Many Requests', message: TOO_MANY_ATTEMPTS_MESSAGE });
    expect(blocked.headers['retry-after']).toBeDefined();
    await post('198.51.100.20').expect(400);
  });
});
