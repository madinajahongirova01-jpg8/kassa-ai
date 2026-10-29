import { describe, expect, it } from "vitest";
import type { ApiCashEntry } from "@/lib/api/types";
import { formatMoney, formatNumber } from "@/lib/format";
import { cashDaySummary, signedCashAmount, toTodayCashEntries } from "@/lib/todayCash";

function apiEntry(overrides: Partial<ApiCashEntry>): ApiCashEntry {
  return {
    id: "00000000-0000-4000-8000-000000000001",
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

describe("toTodayCashEntries", () => {
  it("maps API entries to dirams, kind and Dushanbe time in chronological order", () => {
    const entries = toTodayCashEntries([
      apiEntry({ id: "b", kind: "EXPENSE", category: "TRANSPORT", amount: "30.50", title: "Такси", createdAt: "2026-10-30T09:15:00.000Z" }),
      apiEntry({ id: "a", amount: "1800.00", createdAt: "2026-10-30T03:05:00.000Z" }),
    ]);

    expect(entries).toEqual([
      { id: "a", time: "08:05", title: "Фурӯш", kind: "income", source: "TEXT", amount: 180_000 },
      { id: "b", time: "14:15", title: "Такси", kind: "expense", source: "TEXT", amount: 3_050 },
    ]);
  });

  it("does not change the input array", () => {
    const items = [apiEntry({ id: "b", createdAt: "2026-10-30T09:00:00.000Z" }), apiEntry({ id: "a" })];
    toTodayCashEntries(items);
    expect(items.map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("rejects an amount that is not in the API format", () => {
    expect(() => toTodayCashEntries([apiEntry({ amount: "12.5" })])).toThrow(RangeError);
  });
});

describe("cashDaySummary", () => {
  it("adds income and expense in exact dirams", () => {
    const entries = toTodayCashEntries([
      apiEntry({ id: "a", amount: "0.10" }),
      apiEntry({ id: "b", amount: "0.20" }),
      apiEntry({ id: "c", kind: "EXPENSE", amount: "0.05" }),
    ]);

    expect(cashDaySummary(entries)).toEqual({ income: 30, expense: 5, profit: 25 });
  });

  it("returns zeros for an empty day", () => {
    expect(cashDaySummary([])).toEqual({ income: 0, expense: 0, profit: 0 });
  });
});

describe("signed amounts in somoni", () => {
  it("formats income with a plus and expense with a minus", () => {
    const [income, expense] = toTodayCashEntries([
      apiEntry({ id: "a", amount: "1250.50" }),
      apiEntry({ id: "b", kind: "EXPENSE", amount: "30.00", createdAt: "2026-10-30T05:00:00.000Z" }),
    ]);

    expect(formatMoney(signedCashAmount(income), { sign: true, unit: false })).toBe(`+${formatNumber(1250)}.50`);
    expect(formatNumber(1250)).toMatch(/^1\s250$/);
    expect(formatMoney(signedCashAmount(expense), { sign: true, unit: false })).toBe("−30");
  });
});
