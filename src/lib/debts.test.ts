import { describe, expect, it } from "vitest";
import type { DebtCustomer } from "@/data/debts";
import { buildDebtRows, debtTotals, openDebtorsByUrgency } from "@/lib/debts";

const TODAY = "2026-10-31";

function customer(id: string, balance: number, dueDate: string | null): DebtCustomer {
  return { id, name: `Муштарӣ ${id}`, phone: "", dueDate, balance, lastDebtAmount: balance };
}

describe("openDebtorsByUrgency", () => {
  it("puts the most overdue first, then the nearest due date, then debts without a date", () => {
    const rows = buildDebtRows(
      [
        customer("none", 5000, null),
        customer("later", 1000, "2026-11-20"),
        customer("late2", 2000, "2026-10-29"),
        customer("late10", 3000, "2026-10-21"),
        customer("soon", 4000, "2026-11-01"),
      ],
      [],
      TODAY,
    );

    expect(openDebtorsByUrgency(rows).map((row) => row.customer.id)).toEqual(["late10", "late2", "soon", "later", "none"]);
    expect(openDebtorsByUrgency(rows)[0].status).toBe("overdue");
  });

  it("leaves out customers who owe nothing", () => {
    const rows = buildDebtRows([customer("paid", 0, null), customer("owes", 100, null)], [], TODAY);
    expect(openDebtorsByUrgency(rows).map((row) => row.customer.id)).toEqual(["owes"]);
  });

  it("shows nothing for a new user without customers", () => {
    const rows = buildDebtRows([], [], TODAY);
    expect(openDebtorsByUrgency(rows)).toEqual([]);
    expect(debtTotals(rows)).toEqual({ total: 0, debtorCount: 0, overdue: 0, overdueCount: 0 });
  });
});
