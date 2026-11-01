import { Injectable } from '@nestjs/common';
import { parseCalendarDate, todayInBusinessTimeZone } from '../../common/dates';
import { TelegramTransaction } from '../../generated/prisma/client';
import {
  CashEntryKind,
  DebtStatus,
  TelegramTransactionStatus,
  TelegramTransactionType,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import type { TransactionRepository } from '../bot/repositories/transaction-repository';
import type {
  DailySummary,
  DebtBalance,
  ParsedTransaction,
  StoredTransaction,
  TransactionStatus,
  TransactionType,
} from '../bot/types/transaction';

/** Amount columns are PostgreSQL INTEGER, like every other Kassa amount. */
export const MAX_AMOUNT_DIRAMS = 2_147_483_647;

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
  constructor(private readonly prisma: PrismaService) {}

  async createPending(userId: number, parsed: ParsedTransaction): Promise<StoredTransaction> {
    if (!Number.isSafeInteger(parsed.amountDiram) || parsed.amountDiram <= 0 || parsed.amountDiram > MAX_AMOUNT_DIRAMS) {
      throw new RangeError('Amount must be a positive integer number of dirams within the supported range');
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
      const { count } = await tx.telegramTransaction.updateMany({
        where: { id: transactionId, accountId: userId, status: TelegramTransactionStatus.PENDING },
        data: { status: STATUS_TO_DB[newStatus] },
      });
      if (count !== 1) {
        return null;
      }
      const row = await tx.telegramTransaction.findFirstOrThrow({ where: { id: transactionId, accountId: userId } });
      return toStoredTransaction(row);
    });
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

  /** Open Kassa debts of the owner, one row per customer. */
  private async kassaDebtBalances(ownerId: string): Promise<DebtBalance[]> {
    const debts = await this.prisma.debt.findMany({
      where: { ownerId, status: { not: DebtStatus.PAID } },
      select: { customerId: true, amountDirams: true, paidDirams: true, occurredOn: true, customer: { select: { name: true } } },
    });
    const byCustomer = new Map<string, DebtBalance>();
    for (const debt of debts) {
      const entry = byCustomer.get(debt.customerId) ?? { customerName: debt.customer.name, balanceDiram: 0, oldestCreditAt: null };
      entry.balanceDiram += debt.amountDirams - debt.paidDirams;
      if (entry.oldestCreditAt === null || debt.occurredOn < entry.oldestCreditAt) {
        entry.oldestCreditAt = debt.occurredOn;
      }
      byCustomer.set(debt.customerId, entry);
    }
    return [...byCustomer.values()].filter((entry) => entry.balanceDiram > 0).sort(byBalanceDesc);
  }

  /** Same result as the standalone bot: customers grouped by name, ignoring case. */
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
    });
    const byName = new Map<string, DebtBalance>();
    for (const row of rows) {
      const name = row.customerName ?? '';
      const key = name.toLowerCase();
      const entry = byName.get(key) ?? { customerName: name, balanceDiram: 0, oldestCreditAt: null };
      if (name < entry.customerName) {
        entry.customerName = name;
      }
      if (row.type === TelegramTransactionType.CREDIT_SALE) {
        entry.balanceDiram += row.amountDirams;
        if (entry.oldestCreditAt === null || row.occurredAt < entry.oldestCreditAt) {
          entry.oldestCreditAt = row.occurredAt;
        }
      } else {
        entry.balanceDiram -= row.amountDirams;
      }
      byName.set(key, entry);
    }
    return [...byName.values()].filter((entry) => entry.balanceDiram > 0).sort(byBalanceDesc);
  }
}
