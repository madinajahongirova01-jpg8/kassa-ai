import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { ErrorResponse } from '../src/common/error-response';
import { PrismaService } from '../src/prisma/prisma.service';

type Method = 'CASH' | 'CARD' | 'TRANSFER';

interface PaymentBody {
  id: string;
  amount: string;
  method: Method;
}

interface DebtWithPaymentsBody {
  id: string;
  paidAmount: string;
  payments: PaymentBody[];
}

interface ReportBody {
  debtReturnedByMethod: Record<Method, string>;
  totals: { debtReturned: string };
}

const PASSWORD = 'correct-horse-battery';
const PERIOD = { from: '2026-01-01', to: '2026-01-31' };

describe('Payment methods (e2e)', () => {
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

  async function createDebt(token: string, amount = '100.00'): Promise<{ customerId: string; debtId: string }> {
    const customer = await api().post('/customers').auth(token, { type: 'bearer' }).send({ name: 'Aziz' }).expect(201);
    const customerId = (customer.body as { id: string }).id;
    const debt = await api()
      .post(`/customers/${customerId}/debts`)
      .auth(token, { type: 'bearer' })
      .send({ amount, description: 'Flour', occurredOn: '2026-01-10' })
      .expect(201);
    return { customerId, debtId: (debt.body as { id: string }).id };
  }

  function payCustomer(token: string, customerId: string, body: object): request.Test {
    return api().post(`/customers/${customerId}/payments`).auth(token, { type: 'bearer' }).send(body);
  }

  async function debtPayments(token: string, debtId: string): Promise<DebtWithPaymentsBody> {
    const response = await api().get(`/debts/${debtId}`).auth(token, { type: 'bearer' }).expect(200);
    return response.body as DebtWithPaymentsBody;
  }

  function report(token: string): request.Test {
    return api().get('/reports/summary').query(PERIOD).auth(token, { type: 'bearer' });
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

  it.each<Method>(['CASH', 'CARD', 'TRANSFER'])('saves a customer payment paid by %s', async (method) => {
    const { customerId, debtId } = await createDebt(ownerToken);

    const response = await payCustomer(ownerToken, customerId, { amount: '30.50', paidOn: '2026-01-12', method }).expect(201);

    expect((response.body as { payments: PaymentBody[] }).payments).toEqual([
      expect.objectContaining({ amount: '30.50', method }),
    ]);
    expect((await debtPayments(ownerToken, debtId)).payments.map((payment) => payment.method)).toEqual([method]);
  });

  it('saves the method on a direct debt payment too', async () => {
    const { debtId } = await createDebt(ownerToken);

    const response = await api()
      .post(`/debts/${debtId}/payments`)
      .auth(ownerToken, { type: 'bearer' })
      .send({ amount: '10', paidOn: '2026-01-12', method: 'CARD' })
      .expect(201);

    expect((response.body as { payment: PaymentBody }).payment.method).toBe('CARD');
  });

  it('uses cash when no method is sent', async () => {
    const { customerId } = await createDebt(ownerToken);

    const response = await payCustomer(ownerToken, customerId, { amount: '10', paidOn: '2026-01-12' }).expect(201);

    expect((response.body as { payments: PaymentBody[] }).payments[0].method).toBe('CASH');
  });

  it.each(['CRYPTO', 'cash', '', 5])('rejects the method %p with 400 and saves nothing', async (method) => {
    const { customerId, debtId } = await createDebt(ownerToken);

    const response = await payCustomer(ownerToken, customerId, { amount: '10', paidOn: '2026-01-12', method }).expect(400);

    expect((response.body as ErrorResponse).details).toContain('method must be one of: CASH, CARD, TRANSFER');
    expect(await debtPayments(ownerToken, debtId)).toMatchObject({ paidAmount: '0.00', payments: [] });
  });

  it('reads payments saved before the method existed as cash', async () => {
    const { debtId } = await createDebt(ownerToken);
    const debt = await prisma.debt.findUniqueOrThrow({ where: { id: debtId } });
    await prisma.$executeRaw`
      INSERT INTO "payments" ("id", "owner_id", "debt_id", "amount_dirams", "paid_on")
      VALUES (gen_random_uuid(), ${debt.ownerId}::uuid, ${debtId}::uuid, 1500, '2026-01-11')`;

    expect((await debtPayments(ownerToken, debtId)).payments).toEqual([expect.objectContaining({ amount: '15.00', method: 'CASH' })]);
  });

  it('reports repayments per method for the period', async () => {
    const { customerId } = await createDebt(ownerToken, '500.00');
    await payCustomer(ownerToken, customerId, { amount: '100', paidOn: '2026-01-11' }).expect(201);
    await payCustomer(ownerToken, customerId, { amount: '20.25', paidOn: '2026-01-12', method: 'CASH' }).expect(201);
    await payCustomer(ownerToken, customerId, { amount: '50.50', paidOn: '2026-01-13', method: 'CARD' }).expect(201);
    await payCustomer(ownerToken, customerId, { amount: '70', paidOn: '2026-01-14', method: 'TRANSFER' }).expect(201);
    await payCustomer(ownerToken, customerId, { amount: '9', paidOn: '2026-02-01', method: 'CARD' }).expect(201);

    const body = (await report(ownerToken).expect(200)).body as ReportBody;

    expect(body.debtReturnedByMethod).toEqual({ CASH: '120.25', CARD: '50.50', TRANSFER: '70.00' });
    expect(body.totals.debtReturned).toBe('240.75');
  });

  it('returns zero for every method when nothing was repaid', async () => {
    const body = (await report(ownerToken).expect(200)).body as ReportBody;

    expect(body.debtReturnedByMethod).toEqual({ CASH: '0.00', CARD: '0.00', TRANSFER: '0.00' });
  });

  it('answers 404 to another user and keeps their report separate', async () => {
    const { customerId, debtId } = await createDebt(ownerToken);
    await payCustomer(ownerToken, customerId, { amount: '25', paidOn: '2026-01-12', method: 'CARD' }).expect(201);

    await payCustomer(otherToken, customerId, { amount: '10', paidOn: '2026-01-12', method: 'TRANSFER' }).expect(404);
    await api().get(`/debts/${debtId}`).auth(otherToken, { type: 'bearer' }).expect(404);

    const other = (await report(otherToken).expect(200)).body as ReportBody;
    expect(other.debtReturnedByMethod).toEqual({ CASH: '0.00', CARD: '0.00', TRANSFER: '0.00' });
    expect((await debtPayments(ownerToken, debtId)).payments.map((payment) => payment.method)).toEqual(['CARD']);
  });
});
