import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { ErrorResponse } from '../src/common/error-response';
import { PrismaService } from '../src/prisma/prisma.service';

interface CashEntryBody {
  id: string;
  kind: 'INCOME' | 'EXPENSE';
  category: string;
  amount: string;
  title: string;
  occurredOn: string;
  source: 'VOICE' | 'TEXT' | 'PHOTO';
  createdAt: string;
}

interface CashEntryPageBody {
  items: CashEntryBody[];
  nextCursor: string | null;
}

interface ReportSummaryBody {
  from: string;
  to: string;
  today: string;
  days: {
    date: string;
    income: string;
    expense: string;
    profit: string;
    salesCount: number;
    debtGiven: string;
    debtReturned: string;
  }[];
  expenseByCategory: { category: string; amount: string }[];
  totals: Record<string, string | number>;
}

const PASSWORD = 'correct-horse-battery';

function entry(overrides: object = {}): object {
  return {
    kind: 'EXPENSE',
    category: 'GOODS',
    amount: '600',
    title: 'Flour, 2 bags',
    occurredOn: '2026-01-10',
    source: 'VOICE',
    ...overrides,
  };
}

describe('Cash entries and reports (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let ownerToken: string;
  let otherToken: string;

  function api(): ReturnType<typeof request> {
    return request(app.getHttpServer());
  }

  async function registerToken(email: string): Promise<string> {
    const response = await api().post('/auth/register').send({ email, password: PASSWORD }).expect(201);
    return (response.body as { accessToken: string }).accessToken;
  }

  function createEntries(token: string, entries: object[]): request.Test {
    return api().post('/cash-entries').auth(token, { type: 'bearer' }).send({ entries });
  }

  function listEntries(token: string, query: Record<string, string | number> = {}): request.Test {
    return api().get('/cash-entries').query(query).auth(token, { type: 'bearer' });
  }

  function summary(token: string, query: Record<string, string>): request.Test {
    return api().get('/reports/summary').query(query).auth(token, { type: 'bearer' });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useLogger(false);
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    // Deleting users cascades to all of their data.
    await prisma.user.deleteMany();
    ownerToken = await registerToken('owner@example.com');
    otherToken = await registerToken('other@example.com');
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  it.each([
    ['POST', '/cash-entries'],
    ['GET', '/cash-entries'],
    ['GET', '/reports/summary?from=2026-01-01&to=2026-01-31'],
  ])('%s %s requires a valid token', async (method, path) => {
    const call = method === 'POST' ? api().post(path).send({}) : api().get(path);
    const response = await call.expect(401);
    expect((response.body as ErrorResponse).message).toBe('Missing or invalid access token');
  });

  describe('cash entries', () => {
    it('saves a receipt with exact amounts and lists it newest first', async () => {
      const created = await createEntries(ownerToken, [
        entry({ amount: '0.10' }),
        entry({ kind: 'INCOME', category: 'SALE', amount: '1800.20', title: ' Sales ', occurredOn: '2026-01-11' }),
      ]).expect(201);

      expect((created.body as CashEntryBody[]).map((e) => [e.kind, e.amount, e.title])).toEqual([
        ['EXPENSE', '0.10', 'Flour, 2 bags'],
        ['INCOME', '1800.20', 'Sales'],
      ]);

      const page = (await listEntries(ownerToken).expect(200)).body as CashEntryPageBody;
      expect(page.nextCursor).toBeNull();
      expect(page.items.map((e) => e.occurredOn)).toEqual(['2026-01-11', '2026-01-10']);
      expect(JSON.stringify(page)).not.toContain('ownerId');
    });

    it('saves nothing when one entry of the receipt is invalid', async () => {
      const response = await createEntries(ownerToken, [entry(), entry({ amount: '10.001' })]).expect(400);

      expect((response.body as ErrorResponse).details?.length).toBeGreaterThan(0);
      expect(await prisma.cashEntry.count()).toBe(0);
    });

    it.each([
      ['an empty receipt', []],
      ['an unknown kind', [entry({ kind: 'GIFT' })]],
      ['an unknown category', [entry({ category: 'FUN' })]],
      ['a blank title', [entry({ title: '  ' })]],
      ['a zero amount', [entry({ amount: '0' })]],
      ['a future date', [entry({ occurredOn: '2999-01-01' })]],
      ['an unknown field', [entry({ ownerId: '7f9c2c1e-3b0a-4c39-9a51-0d4f3f7d2a10' })]],
      ['too many entries', Array.from({ length: 51 }, () => entry())],
    ])('rejects %s with 400', async (_case, entries) => {
      await createEntries(ownerToken, entries).expect(400);
      expect(await prisma.cashEntry.count()).toBe(0);
    });

    it('filters by date range and kind', async () => {
      await createEntries(ownerToken, [
        entry({ occurredOn: '2026-01-10' }),
        entry({ kind: 'INCOME', category: 'SALE', occurredOn: '2026-01-11' }),
        entry({ occurredOn: '2026-01-12' }),
      ]).expect(201);

      const dates = async (query: Record<string, string>): Promise<string[]> =>
        ((await listEntries(ownerToken, query).expect(200)).body as CashEntryPageBody).items.map((e) => e.occurredOn);

      expect(await dates({ from: '2026-01-11', to: '2026-01-12' })).toEqual(['2026-01-12', '2026-01-11']);
      expect(await dates({ kind: 'EXPENSE' })).toEqual(['2026-01-12', '2026-01-10']);
      expect(await dates({ from: '2026-02-01' })).toEqual([]);
      await listEntries(ownerToken, { from: '2026-01-12', to: '2026-01-11' }).expect(400);
    });

    it('pages through entries without gaps or repeats', async () => {
      await createEntries(ownerToken, Array.from({ length: 5 }, () => entry())).expect(201);

      const first = (await listEntries(ownerToken, { limit: 3 }).expect(200)).body as CashEntryPageBody;
      const second = (await listEntries(ownerToken, { limit: 3, cursor: first.nextCursor ?? '' }).expect(200))
        .body as CashEntryPageBody;

      expect(first.items).toHaveLength(3);
      expect(second.items).toHaveLength(2);
      expect(second.nextCursor).toBeNull();
      expect(new Set([...first.items, ...second.items].map((e) => e.id)).size).toBe(5);
    });

    it('hides entries of another user', async () => {
      await createEntries(ownerToken, [entry()]).expect(201);

      expect((await listEntries(otherToken).expect(200)).body).toEqual({ items: [], nextCursor: null });
    });
  });

  describe('report summary', () => {
    it('returns zero totals for a period without data', async () => {
      const response = await summary(ownerToken, { from: '2026-01-01', to: '2026-01-31' }).expect(200);
      const body = response.body as ReportSummaryBody;

      expect(body.days).toEqual([]);
      expect(body.expenseByCategory).toEqual([]);
      expect(body.totals).toEqual({
        income: '0.00',
        expense: '0.00',
        profit: '0.00',
        salesCount: 0,
        entriesCount: 0,
        debtGiven: '0.00',
        debtReturned: '0.00',
      });
      expect(body.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('sums cash, debts and payments per day without mixing them into profit', async () => {
      await createEntries(ownerToken, [
        entry({ amount: '600.10', occurredOn: '2026-01-10' }),
        entry({ category: 'TRANSPORT', amount: '30.20', occurredOn: '2026-01-10' }),
        entry({ kind: 'INCOME', category: 'SALE', amount: '950.30', occurredOn: '2026-01-10' }),
        entry({ kind: 'INCOME', category: 'SALE', amount: '100', occurredOn: '2026-01-12' }),
        entry({ kind: 'INCOME', category: 'SALE', amount: '999', occurredOn: '2026-02-01' }),
      ]).expect(201);
      const customer = await api().post('/customers').auth(ownerToken, { type: 'bearer' }).send({ name: 'Aziz' }).expect(201);
      const debt = await api()
        .post(`/customers/${(customer.body as { id: string }).id}/debts`)
        .auth(ownerToken, { type: 'bearer' })
        .send({ amount: '110.00', description: 'Rice', occurredOn: '2026-01-10' })
        .expect(201);
      await api()
        .post(`/debts/${(debt.body as { id: string }).id}/payments`)
        .auth(ownerToken, { type: 'bearer' })
        .send({ amount: '40.50', paidOn: '2026-01-11' })
        .expect(201);

      const body = (await summary(ownerToken, { from: '2026-01-01', to: '2026-01-31' }).expect(200))
        .body as ReportSummaryBody;

      expect(body.days).toEqual([
        {
          date: '2026-01-10',
          income: '950.30',
          expense: '630.30',
          profit: '320.00',
          salesCount: 1,
          debtGiven: '110.00',
          debtReturned: '0.00',
        },
        {
          date: '2026-01-11',
          income: '0.00',
          expense: '0.00',
          profit: '0.00',
          salesCount: 0,
          debtGiven: '0.00',
          debtReturned: '40.50',
        },
        {
          date: '2026-01-12',
          income: '100.00',
          expense: '0.00',
          profit: '100.00',
          salesCount: 1,
          debtGiven: '0.00',
          debtReturned: '0.00',
        },
      ]);
      expect(body.expenseByCategory).toEqual([
        { category: 'GOODS', amount: '600.10' },
        { category: 'TRANSPORT', amount: '30.20' },
      ]);
      expect(body.totals).toEqual({
        income: '1050.30',
        expense: '630.30',
        profit: '420.00',
        salesCount: 2,
        entriesCount: 4,
        debtGiven: '110.00',
        debtReturned: '40.50',
      });
    });

    it('reports a loss as a negative profit', async () => {
      await createEntries(ownerToken, [entry({ amount: '40.05' })]).expect(201);

      const body = (await summary(ownerToken, { from: '2026-01-10', to: '2026-01-10' }).expect(200))
        .body as ReportSummaryBody;

      expect(body.totals.profit).toBe('-40.05');
    });

    it('does not include another user data', async () => {
      await createEntries(ownerToken, [entry()]).expect(201);

      const body = (await summary(otherToken, { from: '2026-01-01', to: '2026-01-31' }).expect(200))
        .body as ReportSummaryBody;

      expect(body.days).toEqual([]);
    });

    it.each([
      ['a missing from', { to: '2026-01-31' }],
      ['from after to', { from: '2026-02-01', to: '2026-01-31' }],
      ['a period longer than 366 days', { from: '2025-01-01', to: '2026-01-02' }],
    ])('rejects %s with 400', async (_case, query) => {
      await summary(ownerToken, query).expect(400);
    });
  });
});
