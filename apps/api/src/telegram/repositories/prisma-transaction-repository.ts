import { Injectable } from '@nestjs/common';
import { formatCalendarDate, parseCalendarDate, todayInBusinessTimeZone } from '../../common/dates';
import { MAX_AMOUNT_DIRAMS } from '../../common/money';
import { Prisma, TelegramTransaction } from '../../generated/prisma/client';
import {
  CashEntryKind,
  DebtStatus,
  TelegramTransactionStatus,
  TelegramTransactionType,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import type { TransactionRepository } from '../bot/repositories/transaction-repository';
import { addDays, getDushanbeDate } from '../bot/services/day-range';
import { DEFAULT_DUE_DAYS } from '../bot/services/debts';
import { TelegramKassaSync } from '../telegram-kassa-sync';
import type {
  DailySummary,
  DebtBalance,
  ParsedTransaction,
  StoredTransaction,
  TransactionStatus,
  TransactionType,
} from '../bot/types/transaction';

/** An amount the bot cannot record: not a positive whole number of dirams or above the Kassa limit. */
export class TelegramAmountError extends RangeError {
  constructor() {
    super('Amount must be a positive integer number of dirams within the Kassa limit');
    this.name = 'TelegramAmountError';
  }
}

const TYPE_TO_DB: Record<TransactionType, TelegramTransactionType> = {
  sale: TelegramTransactionType.SALE,
  expense: TelegramTransactionType.EXPENSE,
  credit_sale: TelegramTransactionType.CREDIT_SALE,
  debt_payment: TelegramTransactionType.DEBT_PAYMENT,
};

const TYPE_FROM_DB: Record<TelegramTransactionType, TransactionType> = {
  [TelegramTransactionType.SALE]: 'sale',
  [TelegramTransactionType.EXPENSE]: 'expense',
  [TelegramTransactionType.CREDIT_SALE]: 'credit_sale',
  [TelegramTransactionType.DEBT_PAYMENT]: 'debt_payment',
};

const STATUS_TO_DB: Record<TransactionStatus, TelegramTransactionStatus> = {
  pending: TelegramTransactionStatus.PENDING,
  confirmed: TelegramTransactionStatus.CONFIRMED,
  cancelled: TelegramTransactionStatus.CANCELLED,
};

const STATUS_FROM_DB: Record<TelegramTransactionStatus, TransactionStatus> = {
  [TelegramTransactionStatus.PENDING]: 'pending',
  [TelegramTransactionStatus.CONFIRMED]: 'confirmed',
  [TelegramTransactionStatus.CANCELLED]: 'cancelled',
};

function toStoredTransaction(row: TelegramTransaction): StoredTransaction {
  return {
    id: row.id,
    userId: row.accountId,
    type: TYPE_FROM_DB[row.type],
    amountDiram: row.amountDirams,
    description: row.description,
    customerName: row.customerName,
    status: STATUS_FROM_DB[row.status],
  };
}

function byBalanceDesc(a: DebtBalance, b: DebtBalance): number {
  return b.balanceDiram - a.balanceDiram;
}

/**
 * The bot's "user" is a Telegram account. A linked account reads its Kassa owner's data, so the bot
 * shows the same numbers as the website; an unlinked account reads only its own bot records that
 * were never written to Kassa. Every query is scoped by the account id or by the linked ownerId.
 */
@Injectable()
export class PrismaTransactionRepository implements TransactionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kassa: TelegramKassaSync,
  ) {}

  async createPending(userId: number, parsed: ParsedTransaction): Promise<StoredTransaction> {
    if (!Number.isSafeInteger(parsed.amountDiram) || parsed.amountDiram <= 0 || parsed.amountDiram > MAX_AMOUNT_DIRAMS) {
      throw new TelegramAmountError();
    }
    const row = await this.prisma.telegramTransaction.create({
      data: {
        accountId: userId,
        type: TYPE_TO_DB[parsed.type],
        amountDirams: parsed.amountDiram,
        description: parsed.description,
        customerName: parsed.customerName,
        // Set by the app in UTC: the column default would follow the database session time zone,
        // and the daily summary compares this instant with UTC day boundaries.
        occurredAt: new Date(),
      },
    });
    return toStoredTransaction(row);
  }

  async resolvePending(
    transactionId: number,
    userId: number,
    newStatus: Exclude<TransactionStatus, 'pending'>,
  ): Promise<StoredTransaction | null> {
    return this.prisma.$transaction(async (tx) => {
      // The conditional UPDATE claims the draft: a second or concurrent confirmation finds it no
      // longer pending and gets null, so a receipt is written to Kassa at most once.
      const { count } = await tx.telegramTransaction.updateMany({
        where: { id: transactionId, accountId: userId, status: TelegramTransactionStatus.PENDING },
        data: { status: STATUS_TO_DB[newStatus] },
      });
      if (count !== 1) {
        return null;
      }
      let row = await tx.telegramTransaction.findFirstOrThrow({ where: { id: transactionId, accountId: userId } });

      if (newStatus === 'confirmed') {
        const ownerId = await this.lockedOwnerId(tx, userId);
        if (ownerId !== null) {
          // Any failure here throws and rolls back the whole transaction: the draft stays pending.
          const references = await this.kassa.write(tx, ownerId, row);
          row = await tx.telegramTransaction.update({
            where: { id: transactionId },
            data: { syncedAt: new Date(), ...references },
          });
        }
      }
      return toStoredTransaction(row);
    });
  }

  /**
   * The Kassa owner the account is linked to, read with a row lock so the link cannot change
   * (unlink, /stop, relink) until this confirmation commits.
   */
  private async lockedOwnerId(tx: Prisma.TransactionClient, accountId: number): Promise<string | null> {
    const rows = await tx.$queryRaw<{ user_id: string | null }[]>`
      SELECT "user_id" FROM "telegram_accounts" WHERE "id" = ${accountId} FOR UPDATE`;
    return rows[0]?.user_id ?? null;
  }

  async getSummary(userId: number, from: Date, to: Date): Promise<DailySummary> {
    const ownerId = await this.linkedOwnerId(userId);
    return ownerId === null ? this.botSummary(userId, from, to) : this.kassaSummary(ownerId, from, to);
  }

  async getDebtBalances(userId: number): Promise<DebtBalance[]> {
    const ownerId = await this.linkedOwnerId(userId);
    return ownerId === null ? this.botDebtBalances(userId) : this.kassaDebtBalances(ownerId);
  }

  private async linkedOwnerId(accountId: number): Promise<string | null> {
    const account = await this.prisma.telegramAccount.findUnique({ where: { id: accountId }, select: { userId: true } });
    return account?.userId ?? null;
  }

  /** Kassa rule, as on the website: income and expense are cash entries only; nasia is reported apart. */
  private async kassaSummary(ownerId: string, from: Date, to: Date): Promise<DailySummary> {
    const occurredOn = {
      gte: parseCalendarDate(todayInBusinessTimeZone(from)),
      lt: parseCalendarDate(todayInBusinessTimeZone(to)),
    };
    const [cash, debts] = await Promise.all([
      this.prisma.cashEntry.groupBy({ by: ['kind'], where: { ownerId, occurredOn }, _sum: { amountDirams: true } }),
      this.prisma.debt.aggregate({ where: { ownerId, occurredOn }, _sum: { amountDirams: true } }),
    ]);
    const sumOf = (kind: CashEntryKind): number => cash.find((row) => row.kind === kind)?._sum.amountDirams ?? 0;
    const income = sumOf(CashEntryKind.INCOME);
    const expense = sumOf(CashEntryKind.EXPENSE);
    return {
      incomeDiram: income,
      expenseDiram: expense,
      creditGivenDiram: debts._sum.amountDirams ?? 0,
      profitDiram: income - expense,
    };
  }

  /** Standalone bot rule, unchanged: a debt payment counts as income, nasia is never income or expense. */
  private async botSummary(accountId: number, from: Date, to: Date): Promise<DailySummary> {
    const rows = await this.prisma.telegramTransaction.groupBy({
      by: ['type'],
      where: {
        accountId,
        status: TelegramTransactionStatus.CONFIRMED,
        syncedAt: null,
        occurredAt: { gte: from, lt: to },
      },
      _sum: { amountDirams: true },
    });
    const sumOf = (type: TelegramTransactionType): number => rows.find((row) => row.type === type)?._sum.amountDirams ?? 0;
    const income = sumOf(TelegramTransactionType.SALE) + sumOf(TelegramTransactionType.DEBT_PAYMENT);
    const expense = sumOf(TelegramTransactionType.EXPENSE);
    return {
      incomeDiram: income,
      expenseDiram: expense,
      creditGivenDiram: sumOf(TelegramTransactionType.CREDIT_SALE),
      profitDiram: income - expense,
    };
  }

  /**
   * Open Kassa debts of the owner, one row per customer. dueOn is the earliest due date of the
   * customer's unpaid debts, exactly as the website derives a customer's due date.
   */
  private async kassaDebtBalances(ownerId: string): Promise<DebtBalance[]> {
    const debts = await this.prisma.debt.findMany({
      where: { ownerId, status: { not: DebtStatus.PAID } },
      select: { customerId: true, amountDirams: true, paidDirams: true, dueOn: true, customer: { select: { name: true } } },
    });
    const byCustomer = new Map<string, DebtBalance>();
    for (const debt of debts) {
      const entry = byCustomer.get(debt.customerId) ?? { customerName: debt.customer.name, balanceDiram: 0, dueOn: null };
      entry.balanceDiram += debt.amountDirams - debt.paidDirams;
      const dueOn = debt.dueOn === null ? null : formatCalendarDate(debt.dueOn);
      if (dueOn !== null && (entry.dueOn === null || dueOn < entry.dueOn)) {
        entry.dueOn = dueOn;
      }
      byCustomer.set(debt.customerId, entry);
    }
    return [...byCustomer.values()].filter((entry) => entry.balanceDiram > 0).sort(byBalanceDesc);
  }

  /**
   * Bot-only records, customers grouped by name ignoring case. Payments cover the oldest nasia
   * first, as in Kassa; the customer is due DEFAULT_DUE_DAYS after their oldest unpaid nasia, the
   * same default a Telegram nasia gets when it is written to Kassa.
   */
  private async botDebtBalances(accountId: number): Promise<DebtBalance[]> {
    const rows = await this.prisma.telegramTransaction.findMany({
      where: {
        accountId,
        status: TelegramTransactionStatus.CONFIRMED,
        syncedAt: null,
        type: { in: [TelegramTransactionType.CREDIT_SALE, TelegramTransactionType.DEBT_PAYMENT] },
        customerName: { not: null },
      },
      select: { type: true, amountDirams: true, customerName: true, occurredAt: true },
      orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }],
    });
    const byName = new Map<string, { customerName: string; credits: { amount: number; on: string }[]; paid: number }>();
    for (const row of rows) {
      const name = row.customerName ?? '';
      const key = name.toLowerCase();
      const entry = byName.get(key) ?? { customerName: name, credits: [], paid: 0 };
      if (name < entry.customerName) {
        entry.customerName = name;
      }
      if (row.type === TelegramTransactionType.CREDIT_SALE) {
        entry.credits.push({ amount: row.amountDirams, on: getDushanbeDate(row.occurredAt) });
      } else {
        entry.paid += row.amountDirams;
      }
      byName.set(key, entry);
    }

    const balances: DebtBalance[] = [];
    for (const { customerName, credits, paid } of byName.values()) {
      let left = paid;
      let oldestUnpaid: string | null = null;
      for (const credit of credits) {
        if (left >= credit.amount) {
          left -= credit.amount;
          continue;
        }
        oldestUnpaid = credit.on;
        break;
      }
      const balanceDiram = credits.reduce((sum, credit) => sum + credit.amount, 0) - paid;
      if (balanceDiram > 0) {
        balances.push({ customerName, balanceDiram, dueOn: oldestUnpaid === null ? null : addDays(oldestUnpaid, DEFAULT_DUE_DAYS) });
      }
    }
    return balances.sort(byBalanceDesc);
  }
}
