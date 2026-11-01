import type { DebtBalance, DebtorSummary } from "../types/transaction";
import { getDushanbeDate } from "./day-range";

/** A nasia recorded without a due date is due this many days after the credit sale date. */
export const DEFAULT_DUE_DAYS = 30;

/**
 * Same rule as the Kassa website: a customer is overdue when the earliest due date of their unpaid
 * debts is before today in Dushanbe. A debt due today is not overdue yet; one without a due date never is.
 */
export function buildDebtList(balances: DebtBalance[], now: Date = new Date()): DebtorSummary[] {
  const today = getDushanbeDate(now);
  return balances.map((b) => ({
    customerName: b.customerName,
    balanceDiram: b.balanceDiram,
    isOverdue: b.balanceDiram > 0 && b.dueOn !== null && b.dueOn < today,
  }));
}
