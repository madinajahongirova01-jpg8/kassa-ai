import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { ErrorResponse } from '../src/common/error-response';
import { PrismaService } from '../src/prisma/prisma.service';

interface CustomerBody {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
  balance: { totalAmount: string; paidAmount: string; remainingAmount: string; openDebtsCount: number };
  createdAt: string;
  updatedAt: string;
}

interface PaymentBody {
  id: string;
  debtId: string;
  amount: string;
  paidOn: string;
  note: string | null;
  createdAt: string;
}

interface DebtBody {
  id: string;
  customerId: string;
  amount: string;
  paidAmount: string;
  remainingAmount: string;
  status: 'ACTIVE' | 'PARTIALLY_PAID' | 'PAID';
  description: string;
  occurredOn: string;
  dueOn: string | null;
  payments?: PaymentBody[];
}

interface PaymentListItemBody extends PaymentBody {
  debt: { id: string; description: string; occurredOn: string };
  customer: { id: string; name: string };
}

interface PaymentPageBody {
  items: PaymentListItemBody[];
  nextCursor: string | null;
}

interface CustomerPaymentBody {
  amount: string;
  payments: PaymentBody[];
  debts: DebtBody[];
}

interface PaymentResultBody {
  payment: PaymentBody;
  debt: DebtBody;
}

const PASSWORD = 'correct-horse-battery';
const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

describe('Customers, debts and payments (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let ownerToken: string;
  let otherToken: string;

  function api(): ReturnType<typeof request> {
    return request(app.getHttpServer());
  }

  async function registerToken(email: string): Promise<string> {
    const response = await api().post('/auth/register').send({ email, password: PASSWORD, businessName: 'Test shop' }).expect(201);
    return (response.body as { accessToken: string }).accessToken;
  }

  async function createCustomer(token: string, body: object = { name: 'Aziz' }): Promise<CustomerBody> {
    const response = await api().post('/customers').auth(token, { type: 'bearer' }).send(body).expect(201);
    return response.body as CustomerBody;
  }

  async function createDebt(token: string, customerId: string, body: object = {}): Promise<DebtBody> {
    const response = await api()
      .post(`/customers/${customerId}/debts`)
      .auth(token, { type: 'bearer' })
      .send({ amount: '100.00', description: 'Flour, 2 bags', occurredOn: '2026-01-10', ...body })
      .expect(201);
    return response.body as DebtBody;
  }

  function pay(token: string, debtId: string, body: object): request.Test {
    return api().post(`/debts/${debtId}/payments`).auth(token, { type: 'bearer' }).send(body);
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.useLogger(false);
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    // Deleting users cascades to their customers, debts and payments.
    await prisma.user.deleteMany();
    ownerToken = await registerToken('owner@example.com');
    otherToken = await registerToken('other@example.com');
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('authorization', () => {
    it.each([
      ['POST', '/customers'],
      ['GET', '/customers'],
      ['GET', `/customers/${UNKNOWN_ID}`],
      ['PATCH', `/customers/${UNKNOWN_ID}`],
      ['POST', `/customers/${UNKNOWN_ID}/debts`],
      ['GET', `/customers/${UNKNOWN_ID}/debts`],
      ['GET', '/debts'],
      ['GET', `/debts/${UNKNOWN_ID}`],
      ['POST', `/debts/${UNKNOWN_ID}/payments`],
      ['GET', `/debts/${UNKNOWN_ID}/payments`],
      ['POST', `/customers/${UNKNOWN_ID}/payments`],
      ['GET', '/payments'],
    ])('%s %s requires a valid token', async (method, path) => {
      const withoutToken = await api()[method.toLowerCase() as 'get' | 'post' | 'patch'](path).send({}).expect(401);
      expect((withoutToken.body as ErrorResponse).message).toBe('Missing or invalid access token');

      await api()[method.toLowerCase() as 'get' | 'post' | 'patch'](path)
        .set('Authorization', 'Bearer not.a.jwt')
        .send({})
        .expect(401);
    });
  });

  describe('customers', () => {
    it('creates, lists, reads and updates a customer', async () => {
      const created = await createCustomer(ownerToken, { name: ' Aziz ', phone: '+992 90 123 45 67', note: 'Neighbour' });

      expect(created).toMatchObject({
        name: 'Aziz',
        phone: '+992 90 123 45 67',
        note: 'Neighbour',
        balance: { totalAmount: '0.00', paidAmount: '0.00', remainingAmount: '0.00', openDebtsCount: 0 },
      });
      expect(JSON.stringify(created)).not.toContain('ownerId');

      const list = await api().get('/customers').auth(ownerToken, { type: 'bearer' }).expect(200);
      expect((list.body as CustomerBody[]).map((customer) => customer.id)).toEqual([created.id]);

      await api().get(`/customers/${created.id}`).auth(ownerToken, { type: 'bearer' }).expect(200);

      const updated = await api()
        .patch(`/customers/${created.id}`)
        .auth(ownerToken, { type: 'bearer' })
        .send({ name: 'Aziz Karimov', phone: null })
        .expect(200);
      expect(updated.body).toMatchObject({ name: 'Aziz Karimov', phone: null, note: 'Neighbour' });
    });

    it.each([
      ['a missing name', {}],
      ['a blank name', { name: '  ' }],
      ['an invalid phone', { name: 'Aziz', phone: 'abc' }],
      ['an injected owner', { name: 'Aziz', ownerId: UNKNOWN_ID }],
    ])('rejects %s with 400', async (_case, body) => {
      const response = await api().post('/customers').auth(ownerToken, { type: 'bearer' }).send(body).expect(400);

      expect((response.body as ErrorResponse).message).toBe('Validation failed');
      expect(await prisma.customer.count()).toBe(0);
    });

    it('rejects clearing the name with 400', async () => {
      const customer = await createCustomer(ownerToken);

      await api().patch(`/customers/${customer.id}`).auth(ownerToken, { type: 'bearer' }).send({ name: null }).expect(400);
    });

    it('rejects a malformed id with 400 and an unknown id with 404', async () => {
      await api().get('/customers/not-a-uuid').auth(ownerToken, { type: 'bearer' }).expect(400);
      await api().get(`/customers/${UNKNOWN_ID}`).auth(ownerToken, { type: 'bearer' }).expect(404);
    });
  });

  describe('debts', () => {
    it('creates a debt with an exact amount and dates', async () => {
      const customer = await createCustomer(ownerToken);

      const debt = await createDebt(ownerToken, customer.id, { amount: '150.5', dueOn: '2026-02-10' });

      expect(debt).toMatchObject({
        customerId: customer.id,
        amount: '150.50',
        paidAmount: '0.00',
        remainingAmount: '150.50',
        status: 'ACTIVE',
        description: 'Flour, 2 bags',
        occurredOn: '2026-01-10',
        dueOn: '2026-02-10',
      });
      const stored = await prisma.debt.findUniqueOrThrow({ where: { id: debt.id } });
      expect(stored.amountDirams).toBe(15_050);

      const list = await api().get(`/customers/${customer.id}/debts`).auth(ownerToken, { type: 'bearer' }).expect(200);
      expect((list.body as DebtBody[]).map((item) => item.id)).toEqual([debt.id]);
    });

    it.each([
      ['a zero amount', { amount: '0' }],
      ['a negative amount', { amount: '-10' }],
      ['three decimal places', { amount: '10.005' }],
      ['a too large amount', { amount: '10000000.01' }],
      ['a non-numeric amount', { amount: 'ten' }],
      ['a missing description', { description: undefined }],
      ['an impossible date', { occurredOn: '2026-02-30' }],
      ['a future date', { occurredOn: '2999-01-01' }],
      ['a due date before the debt date', { dueOn: '2026-01-09' }],
    ])('rejects %s with 400', async (_case, override) => {
      const customer = await createCustomer(ownerToken);

      const response = await api()
        .post(`/customers/${customer.id}/debts`)
        .auth(ownerToken, { type: 'bearer' })
        .send({ amount: '100', description: 'Flour', occurredOn: '2026-01-10', ...override })
        .expect(400);

      expect((response.body as ErrorResponse).message).toBe('Validation failed');
      expect(await prisma.debt.count()).toBe(0);
    });

    it('rejects a debt for an unknown customer with 404', async () => {
      await api()
        .post(`/customers/${UNKNOWN_ID}/debts`)
        .auth(ownerToken, { type: 'bearer' })
        .send({ amount: '100', description: 'Flour', occurredOn: '2026-01-10' })
        .expect(404);
    });

    it('filters debts by status', async () => {
      const customer = await createCustomer(ownerToken);
      const paid = await createDebt(ownerToken, customer.id, { amount: '10' });
      const active = await createDebt(ownerToken, customer.id, { amount: '20' });
      await pay(ownerToken, paid.id, { amount: '10', paidOn: '2026-01-11' }).expect(201);

      const response = await api().get('/debts?status=ACTIVE').auth(ownerToken, { type: 'bearer' }).expect(200);

      expect((response.body as DebtBody[]).map((debt) => debt.id)).toEqual([active.id]);
      await api().get('/debts?status=LOST').auth(ownerToken, { type: 'bearer' }).expect(400);
    });
  });

  describe('payments', () => {
    it('handles partial and full repayment and updates the balances', async () => {
      const customer = await createCustomer(ownerToken);
      const debt = await createDebt(ownerToken, customer.id, { amount: '100.00' });

      const partial = await pay(ownerToken, debt.id, { amount: '25.50', paidOn: '2026-01-11', note: 'Cash' }).expect(201);
      expect((partial.body as PaymentResultBody).payment).toMatchObject({ amount: '25.50', paidOn: '2026-01-11', note: 'Cash' });
      expect((partial.body as PaymentResultBody).debt).toMatchObject({
        paidAmount: '25.50',
        remainingAmount: '74.50',
        status: 'PARTIALLY_PAID',
      });

      const full = await pay(ownerToken, debt.id, { amount: '74.50', paidOn: '2026-01-12' }).expect(201);
      expect((full.body as PaymentResultBody).debt).toMatchObject({
        paidAmount: '100.00',
        remainingAmount: '0.00',
        status: 'PAID',
      });

      const details = await api().get(`/debts/${debt.id}`).auth(ownerToken, { type: 'bearer' }).expect(200);
      expect((details.body as DebtBody).payments?.map((payment) => payment.amount)).toEqual(['25.50', '74.50']);

      const payments = await api().get(`/debts/${debt.id}/payments`).auth(ownerToken, { type: 'bearer' }).expect(200);
      expect((payments.body as PaymentBody[]).length).toBe(2);

      const customerAfter = await api().get(`/customers/${customer.id}`).auth(ownerToken, { type: 'bearer' }).expect(200);
      expect((customerAfter.body as CustomerBody).balance).toEqual({
        totalAmount: '100.00',
        paidAmount: '100.00',
        remainingAmount: '0.00',
        openDebtsCount: 0,
      });
    });

    it('keeps sums exact for amounts that are imprecise in floating point', async () => {
      const customer = await createCustomer(ownerToken);
      const debt = await createDebt(ownerToken, customer.id, { amount: '0.30' });

      await pay(ownerToken, debt.id, { amount: 0.1, paidOn: '2026-01-11' }).expect(201);
      const last = await pay(ownerToken, debt.id, { amount: '0.20', paidOn: '2026-01-11' }).expect(201);

      expect((last.body as PaymentResultBody).debt).toMatchObject({ remainingAmount: '0.00', status: 'PAID' });
    });

    it('refuses an overpayment with 422 and keeps the debt unchanged', async () => {
      const customer = await createCustomer(ownerToken);
      const debt = await createDebt(ownerToken, customer.id, { amount: '100.00' });
      await pay(ownerToken, debt.id, { amount: '40', paidOn: '2026-01-11' }).expect(201);

      const response = await pay(ownerToken, debt.id, { amount: '60.01', paidOn: '2026-01-11' }).expect(422);

      expect(response.body).toEqual({
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: 'Payment exceeds the remaining debt',
        details: ['remainingAmount: 60.00'],
      });
      const stored = await prisma.debt.findUniqueOrThrow({ where: { id: debt.id } });
      expect(stored).toMatchObject({ paidDirams: 4_000, status: 'PARTIALLY_PAID' });
      expect(await prisma.payment.count()).toBe(1);
    });

    it('refuses any payment on a fully paid debt with 422', async () => {
      const customer = await createCustomer(ownerToken);
      const debt = await createDebt(ownerToken, customer.id, { amount: '10' });
      await pay(ownerToken, debt.id, { amount: '10', paidOn: '2026-01-11' }).expect(201);

      const response = await pay(ownerToken, debt.id, { amount: '0.01', paidOn: '2026-01-11' }).expect(422);

      expect((response.body as ErrorResponse).message).toBe('Debt is already fully paid');
    });

    it.each([
      ['a zero amount', { amount: '0' }],
      ['a negative amount', { amount: -5 }],
      ['three decimal places', { amount: '1.001' }],
      ['a missing amount', {}],
      ['a future date', { amount: '1', paidOn: '2999-01-01' }],
      ['a date before the debt', { amount: '1', paidOn: '2026-01-09' }],
      ['an impossible date', { amount: '1', paidOn: '2026-02-30' }],
    ])('rejects %s with 400', async (_case, body) => {
      const customer = await createCustomer(ownerToken);
      const debt = await createDebt(ownerToken, customer.id);

      await pay(ownerToken, debt.id, body).expect(400);

      expect(await prisma.payment.count()).toBe(0);
    });

    it('never lets concurrent payments exceed the debt', async () => {
      const customer = await createCustomer(ownerToken);
      const debt = await createDebt(ownerToken, customer.id, { amount: '100' });

      const responses = await Promise.all(
        Array.from({ length: 5 }, () => pay(ownerToken, debt.id, { amount: '30', paidOn: '2026-01-11' })),
      );

      expect(responses.map((response) => response.status).sort()).toEqual([201, 201, 201, 422, 422]);
      const stored = await prisma.debt.findUniqueOrThrow({ where: { id: debt.id } });
      expect(stored.paidDirams).toBe(9_000);
      expect(await prisma.payment.count()).toBe(3);
    });
  });

  describe('data isolation between users', () => {
    let customer: CustomerBody;
    let debt: DebtBody;

    beforeEach(async () => {
      customer = await createCustomer(ownerToken, { name: 'Owner customer' });
      debt = await createDebt(ownerToken, customer.id);
    });

    it('hides another user customers', async () => {
      const list = await api().get('/customers').auth(otherToken, { type: 'bearer' }).expect(200);
      expect(list.body).toEqual([]);

      await api().get(`/customers/${customer.id}`).auth(otherToken, { type: 'bearer' }).expect(404);
      await api().get(`/customers/${customer.id}/debts`).auth(otherToken, { type: 'bearer' }).expect(404);
    });

    it('does not let another user modify a customer', async () => {
      await api()
        .patch(`/customers/${customer.id}`)
        .auth(otherToken, { type: 'bearer' })
        .send({ name: 'Hijacked' })
        .expect(404);

      expect((await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } })).name).toBe('Owner customer');
    });

    it('does not let another user add a debt to a customer', async () => {
      await api()
        .post(`/customers/${customer.id}/debts`)
        .auth(otherToken, { type: 'bearer' })
        .send({ amount: '1', description: 'Fake', occurredOn: '2026-01-10' })
        .expect(404);

      expect(await prisma.debt.count()).toBe(1);
    });

    it('hides another user debts and payments', async () => {
      const list = await api().get('/debts').auth(otherToken, { type: 'bearer' }).expect(200);
      expect(list.body).toEqual([]);

      const filtered = await api().get(`/debts?customerId=${customer.id}`).auth(otherToken, { type: 'bearer' }).expect(200);
      expect(filtered.body).toEqual([]);

      await api().get(`/debts/${debt.id}`).auth(otherToken, { type: 'bearer' }).expect(404);
      await api().get(`/debts/${debt.id}/payments`).auth(otherToken, { type: 'bearer' }).expect(404);
    });

    it('does not let another user register a payment', async () => {
      await pay(otherToken, debt.id, { amount: '1', paidOn: '2026-01-11' }).expect(404);

      expect(await prisma.payment.count()).toBe(0);
      expect((await prisma.debt.findUniqueOrThrow({ where: { id: debt.id } })).paidDirams).toBe(0);
    });

    it('rejects a debt that mixes owners at the database level', async () => {
      const other = await prisma.user.findUniqueOrThrow({ where: { email: 'other@example.com' } });

      await expect(
        prisma.debt.create({
          data: {
            ownerId: other.id,
            customerId: customer.id,
            amountDirams: 100,
            description: 'Bypass',
            occurredOn: new Date('2026-01-10T00:00:00.000Z'),
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('payment list', () => {
    function listPayments(token: string, query: Record<string, string | number> = {}): request.Test {
      return api().get('/payments').query(query).auth(token, { type: 'bearer' });
    }

    it('returns an empty page when there are no payments', async () => {
      const response = await listPayments(ownerToken).expect(200);

      expect(response.body).toEqual({ items: [], nextCursor: null });
    });

    it('lists payments newest first with their debt and customer', async () => {
      const customer = await createCustomer(ownerToken, { name: 'Aziz' });
      const debt = await createDebt(ownerToken, customer.id, { amount: '100.00', description: 'Flour' });
      await pay(ownerToken, debt.id, { amount: '10.10', paidOn: '2026-01-11' }).expect(201);
      await pay(ownerToken, debt.id, { amount: '20.20', paidOn: '2026-01-12', note: 'cash' }).expect(201);

      const response = await listPayments(ownerToken).expect(200);
      const body = response.body as PaymentPageBody;

      expect(body.nextCursor).toBeNull();
      expect(body.items.map((item) => [item.amount, item.paidOn, item.note])).toEqual([
        ['20.20', '2026-01-12', 'cash'],
        ['10.10', '2026-01-11', null],
      ]);
      expect(body.items[0]).toMatchObject({
        debtId: debt.id,
        debt: { id: debt.id, description: 'Flour', occurredOn: '2026-01-10' },
        customer: { id: customer.id, name: 'Aziz' },
      });
      expect(JSON.stringify(body)).not.toContain('ownerId');
    });

    it('filters by an inclusive date range', async () => {
      const customer = await createCustomer(ownerToken);
      const debt = await createDebt(ownerToken, customer.id);
      for (const paidOn of ['2026-01-11', '2026-01-12', '2026-01-13', '2026-01-14']) {
        await pay(ownerToken, debt.id, { amount: '1', paidOn }).expect(201);
      }

      const dates = async (query: Record<string, string>): Promise<string[]> =>
        ((await listPayments(ownerToken, query).expect(200)).body as PaymentPageBody).items.map((item) => item.paidOn);

      expect(await dates({ from: '2026-01-12', to: '2026-01-13' })).toEqual(['2026-01-13', '2026-01-12']);
      expect(await dates({ from: '2026-01-14' })).toEqual(['2026-01-14']);
      expect(await dates({ to: '2026-01-11' })).toEqual(['2026-01-11']);
      expect(await dates({ from: '2026-02-01' })).toEqual([]);
    });

    it.each([
      ['from after to', { from: '2026-01-13', to: '2026-01-12' }],
      ['an invalid date', { from: '2026-02-30' }],
      ['a zero limit', { limit: 0 }],
      ['a too large limit', { limit: 201 }],
      ['a malformed cursor', { cursor: 'nope' }],
      ['an unknown parameter', { status: 'PAID' }],
    ])('rejects %s with 400', async (_case, query) => {
      await listPayments(ownerToken, query).expect(400);
    });

    it('pages through payments that share a date without gaps or repeats', async () => {
      const customer = await createCustomer(ownerToken);
      const debt = await createDebt(ownerToken, customer.id);
      for (let i = 1; i <= 5; i += 1) {
        await pay(ownerToken, debt.id, { amount: String(i), paidOn: '2026-01-11' }).expect(201);
      }

      const seen: string[] = [];
      let cursor: string | null = null;
      let pages = 0;
      do {
        const query: Record<string, string | number> = cursor === null ? { limit: 2 } : { limit: 2, cursor };
        const page = (await listPayments(ownerToken, query).expect(200)).body as PaymentPageBody;
        seen.push(...page.items.map((item) => item.id));
        cursor = page.nextCursor;
        pages += 1;
      } while (cursor !== null);

      expect(pages).toBe(3);
      expect(new Set(seen).size).toBe(5);
      expect(seen).toEqual((await prisma.payment.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })).map((p) => p.id));
    });

    it('never returns another user payments', async () => {
      const customer = await createCustomer(ownerToken);
      const debt = await createDebt(ownerToken, customer.id);
      await pay(ownerToken, debt.id, { amount: '5', paidOn: '2026-01-11' }).expect(201);

      const response = await listPayments(otherToken).expect(200);

      expect(response.body).toEqual({ items: [], nextCursor: null });
    });
  });

  describe('customer payments', () => {
    function payCustomer(token: string, customerId: string, body: object): request.Test {
      return api().post(`/customers/${customerId}/payments`).auth(token, { type: 'bearer' }).send(body);
    }

    it('splits one payment across open debts, oldest first, in exact amounts', async () => {
      const customer = await createCustomer(ownerToken);
      const older = await createDebt(ownerToken, customer.id, { amount: '100.10', occurredOn: '2026-01-05' });
      const newer = await createDebt(ownerToken, customer.id, { amount: '50.20', occurredOn: '2026-01-10' });

      const response = await payCustomer(ownerToken, customer.id, { amount: '120.20', paidOn: '2026-01-12' }).expect(201);
      const body = response.body as CustomerPaymentBody;

      expect(body.amount).toBe('120.20');
      expect(body.payments.map((payment) => [payment.debtId, payment.amount])).toEqual([
        [older.id, '100.10'],
        [newer.id, '20.10'],
      ]);
      expect(body.debts.map((debt) => [debt.id, debt.remainingAmount, debt.status])).toEqual([
        [older.id, '0.00', 'PAID'],
        [newer.id, '30.10', 'PARTIALLY_PAID'],
      ]);

      const balance = await api().get(`/customers/${customer.id}`).auth(ownerToken, { type: 'bearer' }).expect(200);
      expect((balance.body as CustomerBody).balance).toEqual({
        totalAmount: '150.30',
        paidAmount: '120.20',
        remainingAmount: '30.10',
        openDebtsCount: 1,
      });
    });

    it('pays off everything with the exact remaining total', async () => {
      const customer = await createCustomer(ownerToken);
      await createDebt(ownerToken, customer.id, { amount: '0.10' });
      await createDebt(ownerToken, customer.id, { amount: '0.20' });

      await payCustomer(ownerToken, customer.id, { amount: '0.30', paidOn: '2026-01-12' }).expect(201);

      const debts = await api().get(`/customers/${customer.id}/debts`).auth(ownerToken, { type: 'bearer' }).expect(200);
      expect((debts.body as DebtBody[]).every((debt) => debt.status === 'PAID')).toBe(true);
    });

    it('refuses an overpayment with 422 and saves nothing', async () => {
      const customer = await createCustomer(ownerToken);
      await createDebt(ownerToken, customer.id, { amount: '100.00' });
      await createDebt(ownerToken, customer.id, { amount: '50.00' });

      const response = await payCustomer(ownerToken, customer.id, { amount: '150.01', paidOn: '2026-01-12' }).expect(422);

      expect((response.body as ErrorResponse).details).toEqual(['remainingAmount: 150.00']);
      expect(await prisma.payment.count()).toBe(0);
      expect(await prisma.debt.aggregate({ _sum: { paidDirams: true } })).toEqual({ _sum: { paidDirams: 0 } });
    });

    it('refuses a payment when the customer owes nothing', async () => {
      const customer = await createCustomer(ownerToken);

      await payCustomer(ownerToken, customer.id, { amount: '1' }).expect(422);
    });

    it('only covers debts that existed on the payment date', async () => {
      const customer = await createCustomer(ownerToken);
      await createDebt(ownerToken, customer.id, { amount: '10.00', occurredOn: '2026-01-05' });
      await createDebt(ownerToken, customer.id, { amount: '10.00', occurredOn: '2026-01-20' });

      const tooMuch = await payCustomer(ownerToken, customer.id, { amount: '15', paidOn: '2026-01-10' }).expect(422);
      expect((tooMuch.body as ErrorResponse).details).toEqual(['remainingAmount: 10.00']);

      await payCustomer(ownerToken, customer.id, { amount: '1', paidOn: '2026-01-01' }).expect(400);
    });

    it('never lets concurrent customer payments exceed the debts', async () => {
      const customer = await createCustomer(ownerToken);
      await createDebt(ownerToken, customer.id, { amount: '60.00' });
      await createDebt(ownerToken, customer.id, { amount: '40.00' });

      const results = await Promise.all(
        Array.from({ length: 5 }, () => payCustomer(ownerToken, customer.id, { amount: '30', paidOn: '2026-01-12' })),
      );

      expect(results.map((result) => result.status).sort()).toEqual([201, 201, 201, 422, 422]);
      const paid = await prisma.debt.aggregate({ _sum: { paidDirams: true } });
      expect(paid._sum.paidDirams).toBe(9_000);
    });

    it('answers 404 for another user customer and changes nothing', async () => {
      const customer = await createCustomer(ownerToken);
      await createDebt(ownerToken, customer.id);

      await payCustomer(otherToken, customer.id, { amount: '1', paidOn: '2026-01-12' }).expect(404);

      expect(await prisma.payment.count()).toBe(0);
    });
  });
});
