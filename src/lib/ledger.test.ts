import { describe, expect, it, vi } from "vitest";
import type { ApiCashEntry, ApiCustomer, ApiDebt, ApiPaymentListItem } from "@/lib/api/types";
import {
  buildLedgerEntries,
  cashToLedger,
  entryAmountText,
  expensesByCategory,
  groupLedgerByDay,
  ledgerCsv,
  matchesFilter,
  matchesQuery,
  monthRange,
  monthTitle,
  monthTotals,
  recentMonths,
  resolveMonth,
  type LedgerApiData,
} from "@/lib/ledger";
import { fetchLedgerMonth, type LedgerApi } from "@/lib/ledgerLoad";

const TODAY = "2026-10-30";
const CUSTOMER = "00000000-0000-4000-8000-0000000000c1";

function cash(overrides: Partial<ApiCashEntry>): ApiCashEntry {
  return {
    id: "cash",
    kind: "INCOME",
    category: "SALE",
    amount: "100.00",
    title: "Фурӯш",
    occurredOn: "2026-10-30",
    source: "TEXT",
    createdAt: "2026-10-30T04:00:00.000Z",
    ...overrides,
  };
}

function debt(overrides: Partial<ApiDebt>): ApiDebt {
  return {
    id: "debt",
    customerId: CUSTOMER,
    amount: "120.00",
    paidAmount: "0.00",
    remainingAmount: "120.00",
    status: "ACTIVE",
    description: "Орд",
    occurredOn: "2026-10-20",
    dueOn: null,
    createdAt: "2026-10-20T05:00:00.000Z",
    ...overrides,
  };
}

function payment(overrides: Partial<ApiPaymentListItem>): ApiPaymentListItem {
  return {
    id: "pay",
    debtId: "debt",
    amount: "50.00",
    method: "CASH",
    paidOn: "2026-10-25",
    note: null,
    groupId: "pay",
    cancelledAt: null,
    createdAt: "2026-10-25T10:00:00.000Z",
    debt: { id: "debt", description: "Орд", occurredOn: "2026-10-20" },
    customer: { id: CUSTOMER, name: "Зафар Мирзоев" },
    ...overrides,
  };
}

const customer: ApiCustomer = {
  id: CUSTOMER,
  name: "Зафар Мирзоев",
  phone: null,
  note: null,
  balance: { totalAmount: "120.00", paidAmount: "50.00", remainingAmount: "70.00", openDebtsCount: 1 },
  createdAt: "2026-10-01T00:00:00.000Z",
};

function data(overrides: Partial<LedgerApiData> = {}): LedgerApiData {
  return {
    cashEntries: [
      cash({ id: "sale", amount: "1250.50", createdAt: "2026-10-30T09:15:00.000Z" }),
      cash({ id: "goods", kind: "EXPENSE", category: "GOODS", amount: "300.00", title: "Орд, 1 халта", occurredOn: "2026-10-29", source: "VOICE" }),
      cash({ id: "taxi", kind: "EXPENSE", category: "TRANSPORT", amount: "30.25", title: "Такси", occurredOn: "2026-10-29" }),
      cash({ id: "flour", kind: "EXPENSE", category: "GOODS", amount: "200.00", title: "Шакар", occurredOn: "2026-10-28", source: "PHOTO" }),
    ],
    debts: [debt({}), debt({ id: "old", occurredOn: "2026-09-15" })],
    payments: [payment({})],
    customers: [customer],
    ...overrides,
  };
}

describe("cash entries from the API", () => {
  it("shows income and expense with date, Dushanbe time, category and dirams", () => {
    expect(cashToLedger(cash({ amount: "1250.50", createdAt: "2026-10-30T09:15:00.000Z" }))).toEqual({
      id: "cash",
      date: "2026-10-30",
      time: "14:15",
      title: "Фурӯш",
      category: "sale",
      source: "text",
      kind: "income",
      amount: 125_050,
    });
    expect(cashToLedger(cash({ kind: "EXPENSE", category: "OTHER", source: "PHOTO" }))).toMatchObject({ kind: "expense", category: "other", source: "photo" });
  });

  it("signs income with plus and expense with minus", () => {
    const [income, expense] = buildLedgerEntries(data(), "2026-10");
    expect(entryAmountText(income)).toMatch(/^\+1\s250\.50$/);
    expect(entryAmountText(expense)).toBe("−300");
  });

  it("rejects an amount in an unexpected API format", () => {
    expect(() => cashToLedger(cash({ amount: "12.5" }))).toThrow(RangeError);
  });
});

describe("buildLedgerEntries", () => {
  it("keeps only the chosen month and adds debts and payments with customer names", () => {
    const entries = buildLedgerEntries(data(), "2026-10");
    expect(entries.map((entry) => entry.id)).toEqual(["sale", "goods", "taxi", "flour", "debt-debt", "payment-pay"]);
    expect(entries[4]).toMatchObject({ kind: "debtGiven", title: "Зафар Мирзоев насия гирифт: Орд", amount: 12_000, source: null });
    expect(entries[5]).toMatchObject({ kind: "debtPaid", title: "Зафар Мирзоев қарзашро баргардонд", amount: 5_000 });
  });

  it("leaves cancelled payments out of the Daftar", () => {
    const entries = buildLedgerEntries(data({ payments: [payment({}), payment({ id: "undone", cancelledAt: "2026-10-26T08:00:00.000Z" })] }), "2026-10");
    expect(entries.map((entry) => entry.id)).not.toContain("payment-undone");
    expect(entries.map((entry) => entry.id)).toContain("payment-pay");
  });

  it("returns nothing for a month without records", () => {
    expect(buildLedgerEntries(data(), "2026-08")).toEqual([]);
    expect(buildLedgerEntries({ cashEntries: [], debts: [], payments: [], customers: [] }, "2026-10")).toEqual([]);
  });
});

describe("monthTotals", () => {
  it("profit is income minus expense in exact dirams, debts do not count", () => {
    expect(monthTotals(buildLedgerEntries(data(), "2026-10"))).toEqual({ income: 125_050, expense: 53_025, profit: 72_025 });
  });

  it("can be negative and is zero for an empty month", () => {
    const entries = buildLedgerEntries(data({ cashEntries: [cash({ kind: "EXPENSE", category: "RENT", amount: "500.00" })] }), "2026-10");
    expect(monthTotals(entries)).toEqual({ income: 0, expense: 50_000, profit: -50_000 });
    expect(monthTotals([])).toEqual({ income: 0, expense: 0, profit: 0 });
  });
});

describe("filters", () => {
  const entries = buildLedgerEntries(data(), "2026-10");
  const ids = (list: typeof entries) => list.map((entry) => entry.id);

  it("filters by type", () => {
    expect(ids(entries.filter((entry) => matchesFilter(entry, "all")))).toHaveLength(6);
    expect(ids(entries.filter((entry) => matchesFilter(entry, "income")))).toEqual(["sale"]);
    expect(ids(entries.filter((entry) => matchesFilter(entry, "expense")))).toEqual(["goods", "taxi", "flour"]);
    expect(ids(entries.filter((entry) => matchesFilter(entry, "debt")))).toEqual(["debt-debt", "payment-pay"]);
  });

  it("searches by title and category", () => {
    expect(ids(entries.filter((entry) => matchesQuery(entry, "такси")))).toEqual(["taxi"]);
    expect(ids(entries.filter((entry) => matchesQuery(entry, "МОЛ")))).toEqual(["goods", "flour"]);
    expect(entries.filter((entry) => matchesQuery(entry, "  "))).toHaveLength(6);
  });
});

describe("months", () => {
  it("uses the asked month, but never a future or broken one", () => {
    expect(resolveMonth("2026-09", TODAY)).toBe("2026-09");
    expect(resolveMonth(undefined, TODAY)).toBe("2026-10");
    expect(resolveMonth("2026-11", TODAY)).toBe("2026-10");
    expect(resolveMonth("2026-13", TODAY)).toBe("2026-10");
    expect(resolveMonth("abc", TODAY)).toBe("2026-10");
  });

  it("lists the last 12 months and the full date range of a month", () => {
    const months = recentMonths(TODAY);
    expect(months).toHaveLength(12);
    expect(months[0]).toBe("2026-10");
    expect(months[11]).toBe("2025-11");
    expect(monthRange("2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    expect(monthTitle("2026-10")).toBe("Октябр 2026");
  });
});

describe("expensesByCategory", () => {
  it("groups real expenses by category, largest first", () => {
    expect(expensesByCategory(buildLedgerEntries(data(), "2026-10"))).toEqual([
      { category: "goods", label: "мол", amount: 50_000 },
      { category: "transport", label: "роҳкиро", amount: 3_025 },
    ]);
  });

  it("is empty when there are no expenses", () => {
    expect(expensesByCategory(buildLedgerEntries(data({ cashEntries: [cash({})] }), "2026-10"))).toEqual([]);
  });
});

describe("groupLedgerByDay", () => {
  it("groups by day, newest first, with the profit of the whole day", () => {
    const entries = buildLedgerEntries(data(), "2026-10");
    const days = groupLedgerByDay(entries.filter((entry) => entry.kind === "expense"), entries);
    expect(days.map((day) => [day.date, day.total])).toEqual([
      ["2026-10-29", -33_025],
      ["2026-10-28", -20_000],
    ]);
  });

  it("is empty without entries", () => {
    expect(groupLedgerByDay([])).toEqual([]);
  });
});

describe("ledgerCsv", () => {
  it("exports the shown entries with type and exact amounts", () => {
    const csv = ledgerCsv(buildLedgerEntries(data({ debts: [], payments: [] }), "2026-10").slice(0, 2));
    expect(csv.split("\r\n")).toEqual([
      '"Сана";"Вақт";"Сабт";"Навъ";"Категория";"Маблағ"',
      '"2026-10-29";"09:00";"Орд, 1 халта";"хароҷот";"мол";"−300"',
      expect.stringMatching(/^"2026-10-30";"14:15";"Фурӯш";"даромад";"фурӯш";"\+1\s250\.50"$/),
    ]);
  });
});

describe("fetchLedgerMonth", () => {
  function api(overrides: Partial<LedgerApi> = {}) {
    const source = data();
    const getAll = vi.fn(async (path: string) => (path === "/cash-entries" ? source.cashEntries : source.payments));
    const get = vi.fn(async (path: string) => (path === "/debts" ? source.debts : source.customers));
    return { get: get as unknown as LedgerApi["get"], getAll: getAll as unknown as LedgerApi["getAll"], spies: { get, getAll }, ...overrides };
  }

  it("asks the API for the month range and builds the ledger", async () => {
    const fake = api();
    const ledger = await fetchLedgerMonth("2026-10", TODAY, fake);

    expect(fake.spies.getAll).toHaveBeenCalledWith("/cash-entries", { from: "2026-10-01", to: "2026-10-31" });
    expect(fake.spies.getAll).toHaveBeenCalledWith("/payments", { from: "2026-10-01", to: "2026-10-31" });
    expect(fake.spies.get).toHaveBeenCalledWith("/debts");
    expect(fake.spies.get).toHaveBeenCalledWith("/customers");
    expect(ledger.month).toBe("2026-10");
    expect(ledger.entries).toHaveLength(6);
  });

  it("does not hide API errors behind an empty ledger", async () => {
    const failing = api({ getAll: (async () => Promise.reject(new Error("API 500"))) as LedgerApi["getAll"] });
    await expect(fetchLedgerMonth("2026-10", TODAY, failing)).rejects.toThrow("API 500");
  });

  it("does not hide broken API data either", async () => {
    const broken = api({ get: (async (path: string) => (path === "/debts" ? [debt({ amount: "abc" })] : [])) as LedgerApi["get"] });
    await expect(fetchLedgerMonth("2026-10", TODAY, broken)).rejects.toThrow(RangeError);
  });
});
