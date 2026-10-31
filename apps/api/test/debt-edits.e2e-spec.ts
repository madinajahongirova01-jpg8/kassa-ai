import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { ErrorResponse } from '../src/common/error-response';
import { PrismaService } from '../src/prisma/prisma.service';

interface DebtBody {
  id: string;
  amount: string;
  paidAmount: string;
  remainingAmount: string;
  status: 'ACTIVE' | 'PARTIALLY_PAID' | 'PAID';
  description: string;
  dueOn: string | null;
  payments?: PaymentBody[];
}

interface PaymentBody {
  id: string;
  debtId: string;
  amount: string;
  groupId: string;
  cancelledAt: string | null;
}

interface CancelBody {
  payments: PaymentBody[];
  debts: DebtBody[];
}

interface ReportBody {
  debtReturnedByMethod: Record<'CASH' | 'CARD' | 'TRANSFER', string>;
  totals: { debtReturned: string };
}

const PASSWORD = 'correct-horse-battery';
const PERIOD = { from: '2026-01-01', to: '2026-01-31' };
const MISSING_ID = '5d2e8c3a-1f4b-4a6d-8e9f-0a1b2c3d4e5f';

describe('Debt edits and payment cancellation (e2e)', () => {
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

  async function createCustomer(token: string): Promise<string> {
    const response = await api().post('/customers').auth(token, { type: 'bearer' }).send({ name: 'Aziz' }).expect(201);
    return (response.body as { id: string }).id;
  }

  async function createDebt(token: string, customerId: string, amount: string, occurredOn = '2026-01-10'): Promise<string> {
    const response = await api()
      .post(`/customers/${customerId}/debts`)
      .auth(token, { type: 'bearer' })
      .send({ amount, description: 'Flour', occurredOn })
      .expect(201);
    return (response.body as { id: string }).id;
  }

  async function pay(token: string, customerId: string, amount: string, method = 'CASH'): Promise<PaymentBody[]> {
    const response = await api()
      .post(`/customers/${customerId}/payments`)
      .auth(token, { type: 'bearer' })
      .send({ amount, method, paidOn: '2026-01-12' })
      .expect(201);
    return (response.body as { payments: PaymentBody[] }).payments;
  }

  async function debt(token: string, id: string): Promise<DebtBody> {
    const response = await api().get(`/debts/${id}`).auth(token, { type: 'bearer' }).expect(200);
    return response.body as DebtBody;
  }

  function patchDebt(token: string, id: string, body: object): request.Test {
    return api().patch(`/debts/${id}`).auth(token, { type: 'bearer' }).send(body);
  }

  function cancel(token: string, paymentId: string): request.Test {
    return api().post(`/payments/${paymentId}/cancel`).auth(token, { type: 'bearer' });
  }

  async function report(token: string): Promise<ReportBody> {
    const response = await api().get('/reports/summary').query(PERIOD).auth(token, { type: 'bearer' }).expect(200);
    return response.body as ReportBody;
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
    await prisma.user.deleteMany();
    ownerToken = await registerToken('owner@example.com');
    otherToken = await registerToken('other@example.com');
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('PATCH /debts/:id', () => {
    it('changes the amount, description and due date', async () => {
      const customerId = await createCustomer(ownerToken);
      const debtId = await createDebt(ownerToken, customerId, '100.00');

      const response = await patchDebt(ownerToken, debtId, { amount: '150.50', description: ' Sugar ', dueOn: '2026-02-01' }).expect(200);

      expect(response.body).toMatchObject({
        id: debtId,
        amount: '150.50',
        remainingAmount: '150.50',
        status: 'ACTIVE',
        description: 'Sugar',
        dueOn: '2026-02-01',
      });
      const cleared = await patchDebt(ownerToken, debtId, { dueOn: null }).expect(200);
      expect((cleared.body as DebtBody).dueOn).toBeNull();
    });

    it('recomputes the status when the amount drops to what was paid', async () => {
      const customerId = await createCustomer(ownerToken);
      const debtId = await createDebt(ownerToken, customerId, '100.00');
      await pay(ownerToken, customerId, '40.00');

      const response = await patchDebt(ownerToken, debtId, { amount: '40' }).expect(200);

      expect(response.body).toMatchObject({ amount: '40.00', paidAmount: '40.00', remainingAmount: '0.00', status: 'PAID' });
    });

    it('refuses an amount below what was already paid', async () => {
      const customerId = await createCustomer(ownerToken);
      const debtId = await createDebt(ownerToken, customerId, '100.00');
      await pay(ownerToken, customerId, '40.00');

      const response = await patchDebt(ownerToken, debtId, { amount: '39.99' }).expect(422);

      expect((response.body as ErrorResponse).details).toEqual(['paidAmount: 40.00']);
      expect((await debt(ownerToken, debtId)).amount).toBe('100.00');
    });

    it.each([
      ['an invalid amount', { amount: 'ten' }],
      ['a blank description', { description: ' ' }],
      ['an invalid date', { dueOn: '2026-13-01' }],
      ['a due date before the debt date', { dueOn: '2026-01-09' }],
      ['an empty body', {}],
      ['an unknown field', { ownerId: '7f9c2c1e-3b0a-4c39-9a51-0d4f3f7d2a10' }],
    ])('rejects %s', async (_case, body) => {
      const customerId = await createCustomer(ownerToken);
      const debtId = await createDebt(ownerToken, customerId, '100.00');

      const response = await patchDebt(ownerToken, debtId, body).expect(400);

      expect((response.body as ErrorResponse).details?.length).toBeGreaterThan(0);
    });

    it('returns 404 for a debt of another user and leaves it unchanged', async () => {
      const customerId = await createCustomer(ownerToken);
      const debtId = await createDebt(ownerToken, customerId, '100.00');

      await patchDebt(otherToken, debtId, { amount: '1' }).expect(404);

      expect((await debt(ownerToken, debtId)).amount).toBe('100.00');
    });

    it('requires a session', async () => {
      await api().patch(`/debts/${MISSING_ID}`).send({ amount: '1' }).expect(401);
    });
  });

  describe('POST /payments/:id/cancel', () => {
    it('returns the payment to the balance and recomputes the status', async () => {
      const customerId = await createCustomer(ownerToken);
      const debtId = await createDebt(ownerToken, customerId, '100.00');
      await pay(ownerToken, customerId, '30.00');
      const [mistake] = await pay(ownerToken, customerId, '70.00');
      expect((await debt(ownerToken, debtId)).status).toBe('PAID');

      const response = await cancel(ownerToken, mistake.id).expect(200);

      const body = response.body as CancelBody;
      expect(body.payments).toEqual([expect.objectContaining({ id: mistake.id, cancelledAt: expect.any(String) as unknown })]);
      expect(body.debts).toEqual([
        expect.objectContaining({ id: debtId, paidAmount: '30.00', remainingAmount: '70.00', status: 'PARTIALLY_PAID' }),
      ]);
      const details = await debt(ownerToken, debtId);
      expect(details.remainingAmount).toBe('70.00');
      expect(details.payments?.map((payment) => payment.amount)).toEqual(['30.00']);
    });

    it('cancels every part of a payment split across several debts in one go', async () => {
      const customerId = await createCustomer(ownerToken);
      const first = await createDebt(ownerToken, customerId, '50.00', '2026-01-05');
      const second = await createDebt(ownerToken, customerId, '100.00', '2026-01-10');
      const parts = await pay(ownerToken, customerId, '80.00');
      expect(parts.map((part) => [part.debtId, part.amount])).toEqual([
        [first, '50.00'],
        [second, '30.00'],
      ]);
      expect(new Set(parts.map((part) => part.groupId)).size).toBe(1);

      const body = (await cancel(ownerToken, parts[1].id).expect(200)).body as CancelBody;

      expect(body.payments).toHaveLength(2);
      expect(body.payments.every((payment) => payment.cancelledAt !== null)).toBe(true);
      expect(body.debts.map((d) => [d.id, d.paidAmount, d.status])).toEqual([
        [first, '0.00', 'ACTIVE'],
        [second, '0.00', 'ACTIVE'],
      ]);
      expect((await debt(ownerToken, first)).remainingAmount).toBe('50.00');
      expect((await debt(ownerToken, second)).remainingAmount).toBe('100.00');
    });

    it('does not return the money twice when cancelled again', async () => {
      const customerId = await createCustomer(ownerToken);
      const debtId = await createDebt(ownerToken, customerId, '100.00');
      await pay(ownerToken, customerId, '20.00');
      const [mistake] = await pay(ownerToken, customerId, '30.00');

      await cancel(ownerToken, mistake.id).expect(200);
      await cancel(ownerToken, mistake.id).expect(200);

      expect(await debt(ownerToken, debtId)).toMatchObject({ paidAmount: '20.00', status: 'PARTIALLY_PAID' });
    });

    it('leaves cancelled payments out of the report and the payment list', async () => {
      const customerId = await createCustomer(ownerToken);
      await createDebt(ownerToken, customerId, '100.00');
      await pay(ownerToken, customerId, '25.00', 'CARD');
      const [mistake] = await pay(ownerToken, customerId, '40.00', 'TRANSFER');

      await cancel(ownerToken, mistake.id).expect(200);

      const summary = await report(ownerToken);
      expect(summary.totals.debtReturned).toBe('25.00');
      expect(summary.debtReturnedByMethod).toEqual({ CASH: '0.00', CARD: '25.00', TRANSFER: '0.00' });

      const active = await api().get('/payments').auth(ownerToken, { type: 'bearer' }).expect(200);
      expect((active.body as { items: PaymentBody[] }).items.map((payment) => payment.amount)).toEqual(['25.00']);

      const all = await api().get('/payments').query({ includeCancelled: 'true' }).auth(ownerToken, { type: 'bearer' }).expect(200);
      const items = (all.body as { items: PaymentBody[] }).items;
      expect(items).toHaveLength(2);
      expect(items.find((payment) => payment.id === mistake.id)?.cancelledAt).toEqual(expect.any(String));
    });

    it('returns 404 for a payment of another user and keeps it', async () => {
      const customerId = await createCustomer(ownerToken);
      const debtId = await createDebt(ownerToken, customerId, '100.00');
      const [payment] = await pay(ownerToken, customerId, '30.00');

      await cancel(otherToken, payment.id).expect(404);
      await cancel(ownerToken, MISSING_ID).expect(404);

      expect((await debt(ownerToken, debtId)).paidAmount).toBe('30.00');
    });

    it('rejects an id that is not a UUID', async () => {
      await cancel(ownerToken, 'not-a-uuid').expect(400);
    });
  });
});
