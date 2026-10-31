import { BadRequestException, Injectable } from '@nestjs/common';
import { calendarDateFilter } from '../common/date-range.dto';
import { formatCalendarDate, parseCalendarDate, todayInBusinessTimeZone } from '../common/dates';
import { formatDirams } from '../common/money';
import { CashCategory, CashEntryKind, PaymentMethod } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ReportSummaryQueryDto } from './dto/report-summary-query.dto';

export const MAX_REPORT_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;

export type AmountByMethod = Record<PaymentMethod, string>;

export interface ReportDayResponse {
  date: string;
  income: string;
  expense: string;
  profit: string;
  salesCount: number;
  debtGiven: string;
  debtReturned: string;
  debtReturnedByMethod: AmountByMethod;
}

export interface ReportSummaryResponse {
  from: string;
  to: string;
  /** Today in Asia/Dushanbe, so clients use the same business day as the API. */
  today: string;
  /** Only days that have at least one entry, debt or payment, oldest first. */
  days: ReportDayResponse[];
  expenseByCategory: { category: CashCategory; amount: string }[];
  debtReturnedByMethod: AmountByMethod;
  totals: {
    income: string;
    expense: string;
    profit: string;
    salesCount: number;
    entriesCount: number;
    debtGiven: string;
    debtReturned: string;
  };
}

type MethodSums = Record<PaymentMethod, number>;

interface DayTotals {
  income: number;
  expense: number;
  salesCount: number;
  debtGiven: number;
  debtReturned: MethodSums;
}

const METHODS = Object.values(PaymentMethod);

function emptyMethodSums(): MethodSums {
  return { CASH: 0, CARD: 0, TRANSFER: 0 };
}

function methodTotal(sums: MethodSums): number {
  return METHODS.reduce((total, method) => total + sums[method], 0);
}

function formatMethodSums(sums: MethodSums): AmountByMethod {
  return { CASH: formatDirams(sums.CASH), CARD: formatDirams(sums.CARD), TRANSFER: formatDirams(sums.TRANSFER) };
}

/**
 * Sums are calculated by PostgreSQL over integer dirams. Profit counts only cash entries:
 * giving a debt is not an expense and a repayment is not a sale.
 */
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(ownerId: string, query: ReportSummaryQueryDto): Promise<ReportSummaryResponse> {
    const range = calendarDateFilter(query.from, query.to);
    const days = (parseCalendarDate(query.to).getTime() - parseCalendarDate(query.from).getTime()) / DAY_MS + 1;
    if (days > MAX_REPORT_DAYS) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: [`the report period must not exceed ${MAX_REPORT_DAYS} days`],
      });
    }

    const [cash, categories, debts, payments] = await Promise.all([
      this.prisma.cashEntry.groupBy({
        by: ['occurredOn', 'kind'],
        where: { ownerId, occurredOn: range },
        _sum: { amountDirams: true },
        _count: { _all: true },
      }),
      this.prisma.cashEntry.groupBy({
        by: ['category'],
        where: { ownerId, kind: CashEntryKind.EXPENSE, occurredOn: range },
        _sum: { amountDirams: true },
      }),
      this.prisma.debt.groupBy({
        by: ['occurredOn'],
        where: { ownerId, occurredOn: range },
        _sum: { amountDirams: true },
      }),
      this.prisma.payment.groupBy({
        by: ['paidOn', 'method'],
        where: { ownerId, paidOn: range },
        _sum: { amountDirams: true },
      }),
    ]);

    const byDay = new Map<string, DayTotals>();
    const day = (date: Date): DayTotals => {
      const key = formatCalendarDate(date);
      let totals = byDay.get(key);
      if (totals === undefined) {
        totals = { income: 0, expense: 0, salesCount: 0, debtGiven: 0, debtReturned: emptyMethodSums() };
        byDay.set(key, totals);
      }
      return totals;
    };

    let entriesCount = 0;
    for (const row of cash) {
      const totals = day(row.occurredOn);
      const sum = row._sum.amountDirams ?? 0;
      entriesCount += row._count._all;
      if (row.kind === CashEntryKind.INCOME) {
        totals.income += sum;
        totals.salesCount += row._count._all;
      } else {
        totals.expense += sum;
      }
    }
    for (const row of debts) {
      day(row.occurredOn).debtGiven += row._sum.amountDirams ?? 0;
    }
    const returnedByMethod = emptyMethodSums();
    for (const row of payments) {
      const sum = row._sum.amountDirams ?? 0;
      day(row.paidOn).debtReturned[row.method] += sum;
      returnedByMethod[row.method] += sum;
    }

    const sorted = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
    const total = (pick: (totals: DayTotals) => number): number => sorted.reduce((sum, [, totals]) => sum + pick(totals), 0);
    const income = total((t) => t.income);
    const expense = total((t) => t.expense);

    return {
      from: query.from,
      to: query.to,
      today: todayInBusinessTimeZone(),
      days: sorted.map(([date, totals]) => ({
        date,
        income: formatDirams(totals.income),
        expense: formatDirams(totals.expense),
        profit: formatDirams(totals.income - totals.expense),
        salesCount: totals.salesCount,
        debtGiven: formatDirams(totals.debtGiven),
        debtReturned: formatDirams(methodTotal(totals.debtReturned)),
        debtReturnedByMethod: formatMethodSums(totals.debtReturned),
      })),
      expenseByCategory: categories
        .map((row) => ({ category: row.category, dirams: row._sum.amountDirams ?? 0 }))
        .sort((a, b) => b.dirams - a.dirams || a.category.localeCompare(b.category))
        .map((row) => ({ category: row.category, amount: formatDirams(row.dirams) })),
      debtReturnedByMethod: formatMethodSums(returnedByMethod),
      totals: {
        income: formatDirams(income),
        expense: formatDirams(expense),
        profit: formatDirams(income - expense),
        salesCount: total((t) => t.salesCount),
        entriesCount,
        debtGiven: formatDirams(total((t) => t.debtGiven)),
        debtReturned: formatDirams(methodTotal(returnedByMethod)),
      },
    };
  }
}
