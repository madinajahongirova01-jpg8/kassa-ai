import { createPgliteDatabase, PgliteDatabase } from '../../test/pglite-database';
import { parseCalendarDate, todayInBusinessTimeZone } from '../common/dates';
import { formatDirams } from '../common/money';
import { CustomersService } from '../customers/customers.service';
import { DebtsService } from '../debts/debts.service';
import { Prisma, TelegramTransaction } from '../generated/prisma/client';
import { CashCategory, CashEntryKind, DebtStatus, EntrySource, PaymentMethod } from '../generated/prisma/enums';
import { ReportsService } from '../reports/reports.service';
import { addDays } from './bot/services/day-range';
import { buildDebtList, DEFAULT_DUE_DAYS } from './bot/services/debts';
import { TransactionService } from './bot/services/transaction-service';
import type { ParsedTransaction, StoredTransaction } from './bot/types/transaction';
import { PrismaTransactionRepository } from './repositories/prisma-transaction-repository';
import { PrismaUserRepository } from './repositories/prisma-user-repository';
import { KassaReferences, TelegramKassaSync, TelegramSyncError } from './telegram-kassa-sync';

const TG_A = 1001; // linked to owner A
const TG_B = 1002; // linked to owner B
const TG_FREE = 1003; // not linked

/** Writes to Kassa like the real sync, then fails, to prove the whole confirmation rolls back. */
class FailingAfterWriteSync extends TelegramKassaSync {
  override async write(tx: Prisma.TransactionClient, ownerId: string, receipt: TelegramTransaction): Promise<KassaReferences> {
    await super.write(tx, ownerId, receipt);
    throw new Error('database went away');
  }
}

describe('Confirmed Telegram receipts written to Kassa', () => {
  let db: PgliteDatabase;
  let users: PrismaUserRepository;
  let debtsService: DebtsService;
  let customers: CustomersService;
  let service: TransactionService;
  let ownerA: string;
  let ownerB: string;
  let today: string;

  function serviceWith(sync: TelegramKassaSync): TransactionService {
    return new TransactionService(users, new PrismaTransactionRepository(db.prisma, sync));
  }

  async function draft(telegramUserId: number, parsed: Partial<ParsedTransaction> & Pick<ParsedTransaction, 'type' | 'amountDiram'>): Promise<StoredTransaction> {
    const created = await service.createDraft(telegramUserId, {
      description: `${parsed.type} ${parsed.amountDiram}`,
      customerName: null,
      ...parsed,
    });
    return created!;
  }

  async function confirm(telegramUserId: number, parsed: Parameters<typeof draft>[1]): Promise<StoredTransaction | null> {
    const created = await draft(telegramUserId, parsed);
    return service.confirm(telegramUserId, created.id);
  }

  function row(id: number): Promise<TelegramTransaction> {
    return db.prisma.telegramTransaction.findUniqueOrThrow({ where: { id } });
  }

  async function customer(ownerId: string, name: string): Promise<string> {
    return (await db.prisma.customer.create({ data: { ownerId, name } })).id;
  }

  async function openDebt(ownerId: string, customerId: string, amountDirams: number, occurredOn: string): Promise<string> {
    const debt = await db.prisma.debt.create({
      data: { ownerId, customerId, amountDirams, description: 'nasia', occurredOn: parseCalendarDate(occurredOn) },
    });
    return debt.id;
  }

  async function kassaCounts(ownerId: string): Promise<{ cash: number; customers: number; debts: number; payments: number }> {
    const [cash, customerCount, debts, payments] = await Promise.all([
      db.prisma.cashEntry.count({ where: { ownerId } }),
      db.prisma.customer.count({ where: { ownerId } }),
      db.prisma.debt.count({ where: { ownerId } }),
      db.prisma.payment.count({ where: { ownerId } }),
    ]);
    return { cash, customers: customerCount, debts, payments };
  }

  beforeAll(async () => {
    db = await createPgliteDatabase();
    users = new PrismaUserRepository(db.prisma);
    customers = new CustomersService(db.prisma);
    debtsService = new DebtsService(db.prisma, customers);
    service = serviceWith(new TelegramKassaSync(debtsService));
  }, 60_000);

  beforeEach(async () => {
    await db.reset();
    today = todayInBusinessTimeZone();
    ownerA = (await db.prisma.user.create({ data: { email: 'a@example.com', passwordHash: 'x' } })).id;
    ownerB = (await db.prisma.user.create({ data: { email: 'b@example.com', passwordHash: 'x' } })).id;
    for (const [telegramUserId, ownerId] of [[TG_A, ownerA], [TG_B, ownerB], [TG_FREE, null]] as const) {
      const { user } = await users.upsertFromTelegram({ telegramUserId, telegramChatId: telegramUserId, firstName: null });
      if (ownerId !== null) {
        await db.prisma.telegramAccount.update({ where: { id: user.id }, data: { userId: ownerId, linkedAt: new Date() } });
      }
    }
  });

  afterAll(async () => {
    await db.close();
  });

  describe('sale and expense', () => {
    it('writes a sale as an income cash entry in the Sale category for the linked owner only', async () => {
      const tx = await confirm(TG_A, { type: 'sale', amountDiram: 180_050, description: 'furush 1800.50' });

      expect(tx?.status).toBe('confirmed');
      const entries = await db.prisma.cashEntry.findMany();
      expect(entries).toEqual([
        expect.objectContaining({
          ownerId: ownerA,
          kind: CashEntryKind.INCOME,
          category: CashCategory.SALE,
          amountDirams: 180_050,
          title: 'furush 1800.50',
          occurredOn: parseCalendarDate(today),
          source: EntrySource.TEXT,
        }),
      ]);
      expect(await row(tx!.id)).toMatchObject({ cashEntryId: entries[0].id, debtId: null, paymentGroupId: null });
      expect((await row(tx!.id)).syncedAt).not.toBeNull();
      expect(await kassaCounts(ownerB)).toEqual({ cash: 0, customers: 0, debts: 0, payments: 0 });
    });

    it('writes an expense as an expense cash entry in the Other category', async () => {
      await confirm(TG_A, { type: 'expense', amountDiram: 3_000, description: 'taxi 30' });

      expect(await db.prisma.cashEntry.findMany()).toEqual([
        expect.objectContaining({ ownerId: ownerA, kind: CashEntryKind.EXPENSE, category: CashCategory.OTHER, amountDirams: 3_000 }),
      ]);
    });
  });

  describe('nasia (credit sale)', () => {
    it('creates the customer when new and records only a debt, never income or expense', async () => {
      const tx = await confirm(TG_A, { type: 'credit_sale', amountDiram: 50_000, customerName: 'Ali', description: 'nasia ba Ali 500' });

      const debts = await db.prisma.debt.findMany({ include: { customer: true } });
      expect(debts).toEqual([
        expect.objectContaining({
          ownerId: ownerA,
          amountDirams: 50_000,
          paidDirams: 0,
          status: DebtStatus.ACTIVE,
          description: 'nasia ba Ali 500',
          occurredOn: parseCalendarDate(today),
          // The website has no default due date, so a Telegram nasia is due 30 days after it.
          dueOn: parseCalendarDate(addDays(today, DEFAULT_DUE_DAYS)),
          customer: expect.objectContaining({ ownerId: ownerA, name: 'Ali' }) as unknown,
        }),
      ]);
      expect(await db.prisma.cashEntry.count()).toBe(0);
      expect(await row(tx!.id)).toMatchObject({ debtId: debts[0].id, cashEntryId: null });
      const summary = await service.getTodaySummary(TG_A);
      expect(summary).toEqual({ incomeDiram: 0, expenseDiram: 0, creditGivenDiram: 50_000, profitDiram: 0 });
    });

    it('dates the nasia and its due date by the Dushanbe day of the receipt', async () => {
      const created = await draft(TG_A, { type: 'credit_sale', amountDiram: 1_000, customerName: 'Ali' });
      // 19:30 UTC on 31 October is already 1 November in Dushanbe.
      await db.prisma.telegramTransaction.update({ where: { id: created.id }, data: { occurredAt: new Date('2026-10-31T19:30:00.000Z') } });

      await service.confirm(TG_A, created.id);

      expect(await db.prisma.debt.findFirstOrThrow()).toMatchObject({
        occurredOn: parseCalendarDate('2026-11-01'),
        dueOn: parseCalendarDate('2026-12-01'),
      });
    });

    it('is not overdue in /debts until its due date has passed, like on the website', async () => {
      const created = await draft(TG_A, { type: 'credit_sale', amountDiram: 1_000, customerName: 'Ali' });
      await db.prisma.telegramTransaction.update({ where: { id: created.id }, data: { occurredAt: new Date('2026-09-01T07:00:00.000Z') } });
      await service.confirm(TG_A, created.id);
      const balances = await new PrismaTransactionRepository(db.prisma, new TelegramKassaSync(debtsService)).getDebtBalances(
        (await users.findByTelegramUserId(TG_A))!.id,
      );

      expect(balances).toEqual([{ customerName: 'Ali', balanceDiram: 1_000, dueOn: '2026-10-01' }]);
      expect(buildDebtList(balances, new Date('2026-10-01T18:59:00.000Z'))[0].isOverdue).toBe(false);
      expect(buildDebtList(balances, new Date('2026-10-01T19:00:00.000Z'))[0].isOverdue).toBe(true);
    });

    it('reuses the existing customer whatever the letter case', async () => {
      const existing = await customer(ownerA, 'ali');

      await confirm(TG_A, { type: 'credit_sale', amountDiram: 1_000, customerName: 'ALI' });
      await confirm(TG_A, { type: 'credit_sale', amountDiram: 2_000, customerName: 'Ali' });

      expect(await db.prisma.customer.count({ where: { ownerId: ownerA } })).toBe(1);
      expect(await db.prisma.debt.count({ where: { customerId: existing } })).toBe(2);
    });

    it("never attaches to another owner's customer with the same name", async () => {
      const foreign = await customer(ownerB, 'Ali');

      await confirm(TG_A, { type: 'credit_sale', amountDiram: 1_000, customerName: 'Ali' });

      expect(await db.prisma.debt.count({ where: { customerId: foreign } })).toBe(0);
      expect(await db.prisma.customer.count({ where: { ownerId: ownerA, name: 'Ali' } })).toBe(1);
      expect(await kassaCounts(ownerB)).toEqual({ cash: 0, customers: 1, debts: 0, payments: 0 });
    });

    it('refuses to guess between two customers with the same name and keeps the draft pending', async () => {
      await customer(ownerA, 'Ali');
      await customer(ownerA, 'ALI');
      const created = await draft(TG_A, { type: 'credit_sale', amountDiram: 1_000, customerName: 'ali' });

      await expect(service.confirm(TG_A, created.id)).rejects.toEqual(new TelegramSyncError('customer-ambiguous'));

      expect((await row(created.id)).status).toBe('PENDING');
      expect(await db.prisma.debt.count()).toBe(0);
    });
  });

  describe('debt payment', () => {
    it("pays the customer's open debts oldest first through DebtsService, as one payment group", async () => {
      const ali = await customer(ownerA, 'Ali');
      const older = await openDebt(ownerA, ali, 10_000, '2026-09-01');
      const newer = await openDebt(ownerA, ali, 20_000, '2026-10-01');

      const tx = await confirm(TG_A, { type: 'debt_payment', amountDiram: 15_000, customerName: 'ali', description: 'Ali 150 bargardond' });

      const debts = await db.prisma.debt.findMany({ orderBy: { occurredOn: 'asc' } });
      expect(debts.map((debt) => [debt.id, debt.paidDirams, debt.status])).toEqual([
        [older, 10_000, DebtStatus.PAID],
        [newer, 5_000, DebtStatus.PARTIALLY_PAID],
      ]);
      const payments = await db.prisma.payment.findMany({ orderBy: { amountDirams: 'desc' } });
      expect(payments.map((payment) => [payment.debtId, payment.amountDirams])).toEqual([
        [older, 10_000],
        [newer, 5_000],
      ]);
      expect(payments.every((payment) => payment.ownerId === ownerA && payment.method === PaymentMethod.CASH)).toBe(true);
      expect(payments.every((payment) => payment.paidOn.getTime() === parseCalendarDate(today).getTime())).toBe(true);
      expect(new Set(payments.map((payment) => payment.groupId))).toEqual(new Set([(await row(tx!.id)).paymentGroupId]));
      expect(await db.prisma.cashEntry.count()).toBe(0);
    });

    it('pays the only owing customer when several share the name', async () => {
      await customer(ownerA, 'Ali');
      const owing = await customer(ownerA, 'ALI');
      await openDebt(ownerA, owing, 5_000, '2026-10-01');

      await confirm(TG_A, { type: 'debt_payment', amountDiram: 5_000, customerName: 'Ali' });

      expect((await db.prisma.debt.findFirstOrThrow({ where: { customerId: owing } })).status).toBe(DebtStatus.PAID);
    });

    it.each([
      ['an unknown customer', null, new TelegramSyncError('customer-not-found')],
      ['a customer who owes nothing', 0, new TelegramSyncError('no-open-debts')],
      ['more than the customer owes', 4_000, new TelegramSyncError('exceeds-debt', 4_000)],
    ])('rolls back a payment from %s and keeps the draft pending', async (_label, owed, expected) => {
      if (owed !== null) {
        const ali = await customer(ownerA, 'Ali');
        if (owed > 0) {
          await openDebt(ownerA, ali, owed, '2026-10-01');
        }
      }
      const created = await draft(TG_A, { type: 'debt_payment', amountDiram: 5_000, customerName: 'Ali' });
      const before = await kassaCounts(ownerA);

      const error = await service.confirm(TG_A, created.id).then(
        () => null,
        (rejection: unknown) => rejection,
      );
      expect(error).toEqual(expected);
      expect((error as TelegramSyncError).remainingDirams).toBe(expected.remainingDirams);

      expect(await kassaCounts(ownerA)).toEqual(before);
      expect(await row(created.id)).toMatchObject({ status: 'PENDING', syncedAt: null, paymentGroupId: null });
      expect((await db.prisma.debt.findMany({ where: { ownerId: ownerA } })).every((debt) => debt.paidDirams === 0)).toBe(true);
      expect((await service.cancel(TG_A, created.id))?.status).toBe('cancelled');
    });

    it("never pays another owner's customer with the same name", async () => {
      const foreign = await customer(ownerB, 'Ali');
      await openDebt(ownerB, foreign, 5_000, '2026-10-01');
      const created = await draft(TG_A, { type: 'debt_payment', amountDiram: 5_000, customerName: 'Ali' });

      await expect(service.confirm(TG_A, created.id)).rejects.toEqual(new TelegramSyncError('customer-not-found'));

      expect(await kassaCounts(ownerB)).toEqual({ cash: 0, customers: 1, debts: 1, payments: 0 });
    });
  });

  describe('atomicity and duplicates', () => {
    it('rolls back the Kassa write when anything fails later in the same transaction', async () => {
      const failing = serviceWith(new FailingAfterWriteSync(debtsService));
      const created = await draft(TG_A, { type: 'credit_sale', amountDiram: 1_000, customerName: 'Ali' });

      await expect(failing.confirm(TG_A, created.id)).rejects.toThrow('database went away');

      expect(await kassaCounts(ownerA)).toEqual({ cash: 0, customers: 0, debts: 0, payments: 0 });
      expect(await row(created.id)).toMatchObject({ status: 'PENDING', syncedAt: null, debtId: null });
      expect((await service.confirm(TG_A, created.id))?.status).toBe('confirmed');
      expect(await kassaCounts(ownerA)).toEqual({ cash: 0, customers: 1, debts: 1, payments: 0 });
    });

    it('writes a receipt once, even when confirmed twice or concurrently', async () => {
      const first = await draft(TG_A, { type: 'sale', amountDiram: 1_000 });
      await service.confirm(TG_A, first.id);
      expect(await service.confirm(TG_A, first.id)).toBeNull();
      expect(await service.cancel(TG_A, first.id)).toBeNull();

      const second = await draft(TG_A, { type: 'sale', amountDiram: 2_000 });
      const results = await Promise.all([service.confirm(TG_A, second.id), service.confirm(TG_A, second.id)]);

      expect(results.filter((result) => result !== null)).toHaveLength(1);
      expect((await db.prisma.cashEntry.findMany()).map((entry) => entry.amountDirams).sort()).toEqual([1_000, 2_000]);
    });

    it('writes nothing to Kassa for a cancelled draft', async () => {
      const created = await draft(TG_A, { type: 'sale', amountDiram: 1_000 });
      await service.cancel(TG_A, created.id);

      expect(await kassaCounts(ownerA)).toEqual({ cash: 0, customers: 0, debts: 0, payments: 0 });
    });
  });

  describe('ownership', () => {
    it("never lets one Telegram user confirm another user's draft", async () => {
      const created = await draft(TG_A, { type: 'sale', amountDiram: 1_000 });

      expect(await service.confirm(TG_B, created.id)).toBeNull();

      expect(await db.prisma.cashEntry.count()).toBe(0);
      expect((await row(created.id)).status).toBe('PENDING');
    });

    it('writes to the owner linked at confirmation time, and an unlinked chat writes nothing to Kassa', async () => {
      const created = await draft(TG_A, { type: 'sale', amountDiram: 1_000 });
      await users.setStatus(TG_A, 'stopped');
      await users.upsertFromTelegram({ telegramUserId: TG_A, telegramChatId: TG_A, firstName: null });

      const tx = await service.confirm(TG_A, created.id);
      const free = await confirm(TG_FREE, { type: 'sale', amountDiram: 2_000 });

      expect(tx?.status).toBe('confirmed');
      expect(free?.status).toBe('confirmed');
      expect(await db.prisma.cashEntry.count()).toBe(0);
      expect((await row(created.id)).syncedAt).toBeNull();
      expect(await service.getTodaySummary(TG_A)).toEqual({ incomeDiram: 1_000, expenseDiram: 0, creditGivenDiram: 0, profitDiram: 1_000 });
    });
  });

  describe('/today and /debts for a linked account', () => {
    it('show the same numbers as the website report and customer balance', async () => {
      await confirm(TG_A, { type: 'sale', amountDiram: 100_000 });
      await confirm(TG_A, { type: 'expense', amountDiram: 30_000 });
      await confirm(TG_A, { type: 'credit_sale', amountDiram: 50_000, customerName: 'Ali' });
      await confirm(TG_A, { type: 'debt_payment', amountDiram: 20_000, customerName: 'ali' });
      await confirm(TG_B, { type: 'sale', amountDiram: 999_000 });

      const today = todayInBusinessTimeZone();
      const report = await new ReportsService(db.prisma).summary(ownerA, { from: today, to: today });
      const summary = await service.getTodaySummary(TG_A);

      expect(summary).toEqual({ incomeDiram: 100_000, expenseDiram: 30_000, creditGivenDiram: 50_000, profitDiram: 70_000 });
      expect([summary!.incomeDiram, summary!.expenseDiram, summary!.profitDiram, summary!.creditGivenDiram].map(formatDirams)).toEqual([
        report.totals.income,
        report.totals.expense,
        report.totals.profit,
        report.totals.debtGiven,
      ]);

      const debts = await service.getDebts(TG_A);
      const ali = await db.prisma.customer.findFirstOrThrow({ where: { ownerId: ownerA } });
      const balance = (await customers.findOne(ownerA, ali.id)).balance.remainingAmount;
      expect(debts).toEqual([{ customerName: 'Ali', balanceDiram: 30_000, isOverdue: false }]);
      expect(formatDirams(debts![0].balanceDiram)).toBe(balance);
    });
  });
});
