import { describe, expect, it } from "vitest";
import type { DebtCustomer } from "@/data/debts";
import { buildDebtRows, debtTotals, matchesQuery, openDebtorsByUrgency } from "@/lib/debts";

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

describe("matchesQuery", () => {
  const people: DebtCustomer[] = [
    { id: "rahim", name: "Раҳим Каримов", phone: "+992 93 123 45 67", dueDate: null, balance: 100, lastDebtAmount: 100 },
    { id: "alyona", name: "Алёна", phone: "+992931112233", dueDate: null, balance: 50, lastDebtAmount: 50 },
    { id: "john", name: "John Smith", phone: "900 55 44 33", dueDate: null, balance: 20, lastDebtAmount: 20 },
    { id: "nophone", name: "Бе рақам", phone: "", dueDate: null, balance: 10, lastDebtAmount: 10 },
  ];
  const find = (query: string) => people.filter((person) => matchesQuery(person, query)).map((person) => person.id);

  it("keeps everyone for an empty or blank query", () => {
    expect(find("")).toHaveLength(4);
    expect(find("   ")).toHaveLength(4);
  });

  it("finds by name ignoring case, extra spaces and ё", () => {
    expect(find("раҳим")).toEqual(["rahim"]);
    expect(find("  РАҲИМ   каримов ")).toEqual(["rahim"]);
    expect(find("JOHN")).toEqual(["john"]);
    expect(find("алена")).toEqual(["alyona"]);
  });

  it("finds by phone digits regardless of spaces and +992", () => {
    expect(find("931234567")).toEqual(["rahim"]);
    expect(find("93 123 45")).toEqual(["rahim"]);
    expect(find("+992 93 123")).toEqual(["rahim"]);
    expect(find("992931112233")).toEqual(["alyona"]);
    expect(find("+992 900 55")).toEqual(["john"]);
    expect(find("(900) 55-44")).toEqual(["john"]);
  });

  it("does not match phones by digits hidden inside a name query", () => {
    expect(find("Раҳим 93")).toEqual([]);
  });

  it("returns nothing when no one matches", () => {
    expect(find("Зарина")).toEqual([]);
    expect(find("777")).toEqual([]);
  });
});
