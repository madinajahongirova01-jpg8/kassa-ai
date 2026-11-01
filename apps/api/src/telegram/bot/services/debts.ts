import type { DebtBalance, DebtorSummary } from "../types/transaction";

export const OVERDUE_AFTER_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildDebtList(balances: DebtBalance[], now: Date = new Date()): DebtorSummary[] {
  return balances.map((b) => ({
    customerName: b.customerName,
    balanceDiram: b.balanceDiram,
    isOverdue:
      b.oldestCreditAt !== null &&
      now.getTime() - b.oldestCreditAt.getTime() > OVERDUE_AFTER_DAYS * DAY_MS,
  }));
}