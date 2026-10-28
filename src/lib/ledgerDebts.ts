import type { DebtCustomer, DebtEvent } from "@/data/debts";
import { ledgerOwner, type LedgerEntry, type PaymentMethod } from "@/data/transactions";

const paymentByTag: Record<string, PaymentMethod> = {
  "Нақд": "cash",
  "Корти бонкӣ": "card",
  "Интиқол": "bank",
};

export const DEBT_ENTRY_PREFIX = "НС";

export function isDebtEntry(entry: LedgerEntry) {
  return entry.id.startsWith(DEBT_ENTRY_PREFIX);
}

function shortName(name: string) {
  const [first, last] = name.split(" ");
  return last ? `${first} ${last[0]}.` : first;
}

export function debtPaymentEntries(customers: DebtCustomer[], events: DebtEvent[]): LedgerEntry[] {
  return events
    .filter((event) => event.type === "payment")
    .map((event) => {
      const customer = customers.find((c) => c.id === event.customerId);
      const name = customer ? shortName(customer.name) : "Муштарӣ";
      return {
        id: `${DEBT_ENTRY_PREFIX}${event.id.replace(/\D/g, "").padStart(3, "0")}`,
        title: `Бозпардохти насия (${name})`,
        shortTitle: "Бозпардохти насия",
        description: `Дафтари насия: ${event.note}`,
        category: "debt",
        source: "manual",
        payment: paymentByTag[event.tag] ?? "cash",
        amount: -event.amount,
        date: event.date,
        time: event.time,
        author: ledgerOwner,
        status: "confirmed",
      };
    });
}
