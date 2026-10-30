import { describe, expect, it } from "vitest";
import { canSaveSabt, cashSabtEntries, debtSabtEntries, parseSabt, sabtProfit, toCashEntriesPayload } from "@/lib/sabt";

describe("parseSabt", () => {
  it("reads a sale and an expense as before", () => {
    const entries = parseSabt("Фурӯш 1800, такси 30");

    expect(entries.map(({ title, kind, category, amount }) => ({ title, kind, category, amount }))).toEqual([
      { title: "Фурӯш", kind: "income", category: "SALE", amount: 1800 },
      { title: "Такси", kind: "expense", category: "TRANSPORT", amount: 30 },
    ]);
    expect(sabtProfit(entries)).toBe(1770);
    expect(toCashEntriesPayload(entries, "TEXT")).toEqual({
      entries: [
        { kind: "INCOME", category: "SALE", amount: "1800.00", title: "Фурӯш", source: "TEXT" },
        { kind: "EXPENSE", category: "TRANSPORT", amount: "30.00", title: "Такси", source: "TEXT" },
      ],
    });
  });

  it("keeps a debt out of income and expense", () => {
    const entries = parseSabt("Раҳим 120 насия гирифт");

    expect(cashSabtEntries(entries)).toEqual([]);
    expect(debtSabtEntries(entries)).toHaveLength(1);
    expect(debtSabtEntries(entries)[0]).toMatchObject({ kind: "debt", amount: 120 });
    expect(sabtProfit(entries)).toBe(0);
    expect(toCashEntriesPayload(entries, "TEXT")).toEqual({ entries: [] });
  });

  it.each(["Каримов 200 қарз гирифт", "Нигина 50 қарзашро баргардонд", "Рустам 300 насия"])("treats «%s» as a debt", (text) => {
    expect(cashSabtEntries(parseSabt(text))).toEqual([]);
  });

  it("saves only the sale from a mixed text", () => {
    const entries = parseSabt("Фурӯш 500, Раҳим 120 насия гирифт");

    expect(debtSabtEntries(entries).map((entry) => entry.amount)).toEqual([120]);
    expect(sabtProfit(entries)).toBe(500);
    expect(toCashEntriesPayload(entries, "VOICE")).toEqual({
      entries: [{ kind: "INCOME", category: "SALE", amount: "500.00", title: "Фурӯш", source: "VOICE" }],
    });
  });

  it("checks amounts of cash entries only", () => {
    expect(canSaveSabt(parseSabt("Фурӯш 0"))).toBe(false);
    expect(canSaveSabt(parseSabt("Фурӯш 500, Раҳим 0 насия"))).toBe(true);
  });
});
