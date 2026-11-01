import { createPgliteDatabase, PgliteDatabase } from '../../../test/pglite-database';
import { parseCalendarDate } from '../../common/dates';
import { MAX_AMOUNT_DIRAMS } from '../../common/money';
import { CustomersService } from '../../customers/customers.service';
import { DebtsService } from '../../debts/debts.service';
import { CashCategory, CashEntryKind, DebtStatus, EntrySource } from '../../generated/prisma/enums';
import { getTodayRange } from '../bot/services/day-range';
import type { StoredTransaction, TransactionType } from '../bot/types/transaction';
import { PrismaTransactionRepository } from './prisma-transaction-repository';
import { TelegramKassaSync } from '../telegram-kassa-sync';
import { PrismaUserRepository } from './prisma-user-repository';

// 20:30 UTC is 01:30 on 2 November in Dushanbe: the bot day is 2026-11-02.
const NOW = new Date('2026-11-01T20:30:00.000Z');
const { from: DAY_START, to: DAY_END } = getTodayRange(NOW);
const IN_DAY = new Date('2026-11-02T05:00:00.000Z');
const BEFORE_DAY = new Date(DAY_START.getTime() - 1);

describe('PrismaTransactionRepository', () => {
  let db: PgliteDatabase;
  let repo: PrismaTransactionRepository;
  let users: PrismaUserRepository;
  let accountA: number;
  let accountB: number;

  async function account(telegramUserId: number): Promise<number> {
    return (await users.upsertFromTelegram({ telegramUserId, telegramChatId: telegramUserId, firstName: null })).user.id;
  }

  async function confirmed(
    accountId: number,
    type: TransactionType,
    amountDiram: number,
    customerName: string | null = null,
    occurredAt: Date = IN_DAY,
  ): Promise<StoredTransaction> {
    const draft = await repo.createPending(accountId, { type, amountDiram, description: `${type} ${amountDiram}`, customerName });
    await db.prisma.telegramTransaction.update({ where: { id: draft.id }, data: { occurredAt } });
    return (await repo.resolvePending(draft.id, accountId, 'confirmed'))!;
  }

  async function kassaOwner(email: string): Promise<string> {
    return (await db.prisma.user.create({ data: { email, passwordHash: 'x' } })).id;
  }

  async function link(accountId: number, ownerId: string): Promise<void> {
    await db.prisma.telegramAccount.update({ where: { id: accountId }, data: { userId: ownerId, linkedAt: new Date() } });
  }

  async function cash(ownerId: string, kind: CashEntryKind, amountDirams: number, date: string): Promise<void> {
    await db.prisma.cashEntry.create({
      data: {
        ownerId,
        kind,
        category: kind === CashEntryKind.INCOME ? CashCategory.SALE : CashCategory.OTHER,
        amountDirams,
        title: 'entry',
        occurredOn: parseCalendarDate(date),
        source: EntrySource.TEXT,
      },
    });
  }

  async function debt(ownerId: string, customerName: string, amountDirams: number, paidDirams: number, date: string): Promise<void> {
    const customer =
      (await db.prisma.customer.findFirst({ where: { ownerId, name: customerName } })) ??
      (await db.prisma.customer.create({ data: { ownerId, name: customerName } }));
    const status =
      paidDirams === 0 ? DebtStatus.ACTIVE : paidDirams === amountDirams ? DebtStatus.PAID : DebtStatus.PARTIALLY_PAID;
    await db.prisma.debt.create({
      data: {
        ownerId,
        customerId: customer.id,
        amountDirams,
        paidDirams,
        status,
        description: 'nasia',
        occurredOn: parseCalendarDate(date),
      },
    });
  }

  beforeAll(async () => {
    db = await createPgliteDatabase();
    repo = new PrismaTransactionRepository(db.prisma, new TelegramKassaSync(new DebtsService(db.prisma, new CustomersService(db.prisma))));
    users = new PrismaUserRepository(db.prisma);
  }, 60_000);

  beforeEach(async () => {
    await db.reset();
    accountA = await account(1001);
    accountB = await account(1002);
  });

  afterAll(async () => {
    await db.close();
  });

  describe('createPending', () => {
    it('stores a pending draft for that account in integer dirams', async () => {
      const draft = await repo.createPending(accountA, {
        type: 'credit_sale',
        amountDiram: 12_345,
        description: 'nasia ba Ali 123.45',
        customerName: 'Ali',
      });

      expect(draft).toEqual({
        id: draft.id,
        userId: accountA,
        type: 'credit_sale',
        amountDiram: 12_345,
        description: 'nasia ba Ali 123.45',
        customerName: 'Ali',
        status: 'pending',
      });
      const row = await db.prisma.telegramTransaction.findUniqueOrThrow({ where: { id: draft.id } });
      expect(row).toMatchObject({ accountId: accountA, syncedAt: null, cashEntryId: null, debtId: null });
      expect(Math.abs(row.occurredAt.getTime() - Date.now())).toBeLessThan(60_000);
    });

    it.each([0, -100, 10.5, MAX_AMOUNT_DIRAMS + 1, Number.MAX_SAFE_INTEGER])('rejects amount %p and stores nothing', async (amountDiram) => {
      await expect(
        repo.createPending(accountA, { type: 'sale', amountDiram, description: 'sale', customerName: null }),
      ).rejects.toThrow(RangeError);
      expect(await db.prisma.telegramTransaction.count()).toBe(0);
    });

    it('accepts the largest supported amount', async () => {
      const draft = await repo.createPending(accountA, { type: 'sale', amountDiram: MAX_AMOUNT_DIRAMS, description: 'big', customerName: null });
      expect(draft.amountDiram).toBe(MAX_AMOUNT_DIRAMS);
    });
  });

  describe('resolvePending', () => {
    it('confirms or cancels a pending draft once', async () => {
      const sale = await repo.createPending(accountA, { type: 'sale', amountDiram: 100, description: 'sale', customerName: null });
      const expense = await repo.createPending(accountA, { type: 'expense', amountDiram: 50, description: 'taxi', customerName: null });

      expect((await repo.resolvePending(sale.id, accountA, 'confirmed'))?.status).toBe('confirmed');
      expect(await repo.resolvePending(sale.id, accountA, 'confirmed')).toBeNull();
      expect(await repo.resolvePending(sale.id, accountA, 'cancelled')).toBeNull();
      expect((await repo.resolvePending(expense.id, accountA, 'cancelled'))?.status).toBe('cancelled');
      expect(await repo.resolvePending(9999, accountA, 'confirmed')).toBeNull();
    });

    it('never resolves a draft of another account', async () => {
      const draft = await repo.createPending(accountA, { type: 'sale', amountDiram: 100, description: 'sale', customerName: null });

      expect(await repo.resolvePending(draft.id, accountB, 'confirmed')).toBeNull();
      expect(await repo.resolvePending(draft.id, accountB, 'cancelled')).toBeNull();
      expect((await db.prisma.telegramTransaction.findUniqueOrThrow({ where: { id: draft.id } })).status).toBe('PENDING');
    });
  });

  describe('unlinked account (bot-only records)', () => {
    it('sums only its own confirmed, unsynced records of the Dushanbe day', async () => {
      await confirmed(accountA, 'sale', 10_000);
      await confirmed(accountA, 'debt_payment', 2_000, 'Ali');
      await confirmed(accountA, 'expense', 3_000);
      await confirmed(accountA, 'credit_sale', 5_000, 'Ali');
      await confirmed(accountA, 'sale', 70_000, null, BEFORE_DAY);
      await confirmed(accountA, 'sale', 80_000, null, DAY_END);
      await repo.createPending(accountA, { type: 'sale', amountDiram: 90_000, description: 'pending', customerName: null });
      const cancelled = await repo.createPending(accountA, { type: 'expense', amountDiram: 90_000, description: 'x', customerName: null });
      await repo.resolvePending(cancelled.id, accountA, 'cancelled');
      const synced = await confirmed(accountA, 'sale', 40_000);
      await db.prisma.telegramTransaction.update({ where: { id: synced.id }, data: { syncedAt: new Date() } });
      await confirmed(accountB, 'sale', 60_000);

      expect(await repo.getSummary(accountA, DAY_START, DAY_END)).toEqual({
        incomeDiram: 12_000,
        expenseDiram: 3_000,
        creditGivenDiram: 5_000,
        profitDiram: 9_000,
      });
      expect(await repo.getSummary(accountB, DAY_START, DAY_END)).toEqual({
        incomeDiram: 60_000,
        expenseDiram: 0,
        creditGivenDiram: 0,
        profitDiram: 60_000,
      });
    });

    it('groups its debts by customer name ignoring case, minus payments, largest first', async () => {
      const old = new Date('2026-09-01T10:00:00.000Z');
      await confirmed(accountA, 'credit_sale', 10_000, 'Ali', old);
      await confirmed(accountA, 'credit_sale', 5_000, 'ali');
      await confirmed(accountA, 'debt_payment', 3_000, 'ALI');
      await confirmed(accountA, 'credit_sale', 20_000, 'Vali');
      await confirmed(accountA, 'credit_sale', 1_000, 'Paid');
      await confirmed(accountA, 'debt_payment', 1_000, 'paid');
      await repo.createPending(accountA, { type: 'credit_sale', amountDiram: 50_000, description: 'n', customerName: 'Ali' });
      await confirmed(accountB, 'credit_sale', 99_000, 'Ali');

      // Due 30 days after the oldest unpaid nasia, counted in Dushanbe calendar days.
      expect(await repo.getDebtBalances(accountA)).toEqual([
        { customerName: 'Vali', balanceDiram: 20_000, dueOn: '2026-12-02' },
        { customerName: 'ALI', balanceDiram: 12_000, dueOn: '2026-10-01' },
      ]);
      expect(await repo.getDebtBalances(accountB)).toEqual([{ customerName: 'Ali', balanceDiram: 99_000, dueOn: '2026-12-02' }]);
    });

    it('takes the due date from the oldest nasia not yet covered by payments, oldest first', async () => {
      await confirmed(accountA, 'credit_sale', 2_000, 'Zafar', new Date('2026-09-01T10:00:00.000Z'));
      await confirmed(accountA, 'credit_sale', 4_000, 'Zafar', new Date('2026-10-10T10:00:00.000Z'));
      await confirmed(accountA, 'debt_payment', 2_500, 'Zafar');

      expect(await repo.getDebtBalances(accountA)).toEqual([{ customerName: 'Zafar', balanceDiram: 3_500, dueOn: '2026-11-09' }]);
    });

    it('dates a nasia by the Dushanbe day it was made, not the UTC day', async () => {
      // 19:30 UTC on 31 October is already 1 November in Dushanbe.
      await confirmed(accountA, 'credit_sale', 1_000, 'Ali', new Date('2026-10-31T19:30:00.000Z'));
      expect((await repo.getDebtBalances(accountA))[0].dueOn).toBe('2026-12-01');
    });
  });

  describe('linked account (Kassa data of its owner)', () => {
    let ownerA: string;
    let ownerB: string;

    beforeEach(async () => {
      ownerA = await kassaOwner('a@example.com');
      ownerB = await kassaOwner('b@example.com');
      await cash(ownerA, CashEntryKind.INCOME, 100_000, '2026-11-02');
      await cash(ownerA, CashEntryKind.EXPENSE, 30_000, '2026-11-02');
      await cash(ownerA, CashEntryKind.INCOME, 999_000, '2026-11-01');
      await debt(ownerA, 'Ali', 25_000, 0, '2026-11-02');
      await debt(ownerA, 'Ali', 10_000, 4_000, '2026-10-01');
      await debt(ownerA, 'Vali', 8_000, 8_000, '2026-10-15');
      await cash(ownerB, CashEntryKind.INCOME, 777_000, '2026-11-02');
      await debt(ownerB, 'Bobo', 55_000, 0, '2026-11-02');
      await confirmed(accountA, 'sale', 123_000);
      await confirmed(accountA, 'credit_sale', 321_000, 'Unsynced');
      await link(accountA, ownerA);
    });

    it("sums its owner's cash entries of the Dushanbe day; nasia is apart and repayments are not income", async () => {
      const payment = await db.prisma.debt.findFirstOrThrow({ where: { ownerId: ownerA, paidDirams: 4_000 } });
      await db.prisma.payment.create({
        data: { ownerId: ownerA, debtId: payment.id, amountDirams: 4_000, paidOn: parseCalendarDate('2026-11-02') },
      });

      expect(await repo.getSummary(accountA, DAY_START, DAY_END)).toEqual({
        incomeDiram: 100_000,
        expenseDiram: 30_000,
        creditGivenDiram: 25_000,
        profitDiram: 70_000,
      });
    });

    it("lists its owner's open Kassa debts per customer and nothing of another owner or of the bot", async () => {
      expect(await repo.getDebtBalances(accountA)).toEqual([{ customerName: 'Ali', balanceDiram: 31_000, dueOn: null }]);
    });

    it('uses the earliest due date of the unpaid Kassa debts, like the website', async () => {
      const [ali, vali] = await Promise.all(['Ali', 'Vali'].map((name) => db.prisma.customer.findFirstOrThrow({ where: { ownerId: ownerA, name } })));
      await db.prisma.debt.updateMany({ where: { customerId: ali.id, paidDirams: 0 }, data: { dueOn: parseCalendarDate('2026-12-20') } });
      await db.prisma.debt.updateMany({ where: { customerId: ali.id, paidDirams: 4_000 }, data: { dueOn: parseCalendarDate('2026-11-10') } });
      // A paid debt's due date does not count.
      await db.prisma.debt.updateMany({ where: { customerId: vali.id }, data: { dueOn: parseCalendarDate('2026-10-20') } });

      expect(await repo.getDebtBalances(accountA)).toEqual([{ customerName: 'Ali', balanceDiram: 31_000, dueOn: '2026-11-10' }]);
    });

    it('keeps two customers with the same name apart', async () => {
      await db.prisma.customer.create({ data: { ownerId: ownerA, name: 'Ali' } });
      const second = await db.prisma.customer.findFirstOrThrow({ where: { ownerId: ownerA, name: 'Ali', debts: { none: {} } } });
      await db.prisma.debt.create({
        data: { ownerId: ownerA, customerId: second.id, amountDirams: 1_500, description: 'n', occurredOn: parseCalendarDate('2026-11-02') },
      });

      expect((await repo.getDebtBalances(accountA)).map((row) => [row.customerName, row.balanceDiram])).toEqual([
        ['Ali', 31_000],
        ['Ali', 1_500],
      ]);
    });

    it('follows the link: after relinking to another owner it sees only that owner', async () => {
      await link(accountA, ownerB);

      expect(await repo.getSummary(accountA, DAY_START, DAY_END)).toEqual({
        incomeDiram: 777_000,
        expenseDiram: 0,
        creditGivenDiram: 55_000,
        profitDiram: 777_000,
      });
      expect((await repo.getDebtBalances(accountA)).map((row) => row.customerName)).toEqual(['Bobo']);
    });

    it('after unlinking (/stop) it sees only its own bot records again, never Kassa data', async () => {
      await users.setStatus(1001, 'stopped');

      expect(await repo.getSummary(accountA, DAY_START, DAY_END)).toEqual({
        incomeDiram: 123_000,
        expenseDiram: 0,
        creditGivenDiram: 321_000,
        profitDiram: 123_000,
      });
      expect((await repo.getDebtBalances(accountA)).map((row) => row.customerName)).toEqual(['Unsynced']);
    });

    it('an unlinked account sees nothing of any Kassa owner', async () => {
      expect(await repo.getSummary(accountB, DAY_START, DAY_END)).toEqual({
        incomeDiram: 0,
        expenseDiram: 0,
        creditGivenDiram: 0,
        profitDiram: 0,
      });
      expect(await repo.getDebtBalances(accountB)).toEqual([]);
    });
  });
});
