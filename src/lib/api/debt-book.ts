import "server-only";
import type { DebtBook, DebtCustomer, DebtEvent } from "@/data/debts";
import { sessionGet, sessionGetAll } from "@/lib/api/session-data";
import type { ApiCustomer, ApiDebt, ApiMe, ApiPaymentListItem } from "@/lib/api/types";
import { businessTime, businessToday } from "@/lib/dates";
import { toDirams } from "@/lib/money";

export function toDebtEvent(debt: ApiDebt): DebtEvent {
  return {
    id: debt.id,
    customerId: debt.customerId,
    type: "debt",
    note: debt.description,
    amount: toDirams(debt.amount),
    date: debt.occurredOn,
    time: businessTime(debt.createdAt),
  };
}

export function toPaymentEvent(payment: ApiPaymentListItem): DebtEvent {
  return {
    id: payment.id,
    customerId: payment.customer.id,
    type: "payment",
    note: payment.note ?? "Пардохт",
    amount: -toDirams(payment.amount),
    date: payment.paidOn,
    time: businessTime(payment.createdAt),
  };
}

function toDebtCustomer(customer: ApiCustomer, debts: ApiDebt[]): DebtCustomer {
  const own = debts.filter((d) => d.customerId === customer.id);
  const dueDates = own.filter((d) => d.status !== "PAID" && d.dueOn !== null).map((d) => d.dueOn as string);
  // The API lists debts newest first.
  const newest = own[0];
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone ?? "",
    note: customer.note ?? undefined,
    dueDate: dueDates.length > 0 ? dueDates.sort()[0] : null,
    balance: toDirams(customer.balance.remainingAmount),
    lastDebtAmount: newest ? toDirams(newest.amount) : 0,
  };
}

function displayBusinessName({ user }: ApiMe): string | null {
  return user.businessName?.trim() || user.name?.trim() || null;
}

/**
 * Customers with their debts (and, when asked, every payment) of the signed-in user.
 * Balances come from the API, which sums integer dirams in the database.
 */
export async function loadDebtBook(returnTo: string, { withPayments }: { withPayments: boolean }): Promise<DebtBook> {
  const [me, customers, debts, payments] = await Promise.all([
    sessionGet<ApiMe>("/auth/me", returnTo),
    sessionGet<ApiCustomer[]>("/customers", returnTo),
    sessionGet<ApiDebt[]>("/debts", returnTo),
    withPayments ? sessionGetAll<ApiPaymentListItem>("/payments", {}, returnTo) : Promise.resolve([]),
  ]);
  return {
    today: businessToday(),
    businessName: displayBusinessName(me),
    customers: customers.map((customer) => toDebtCustomer(customer, debts)),
    events: [...debts.map(toDebtEvent), ...payments.map(toPaymentEvent)],
  };
}
