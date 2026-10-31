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

function summary(text: string) {
  return parseSabt(text).map(({ title, kind, category, amount }) => ({ title, kind, category, amount }));
}

describe("parseSabt in Russian", () => {
  it("reads «продажа 500» as income", () => {
    expect(summary("продажа 500")).toEqual([{ title: "Продажа", kind: "income", category: "SALE", amount: 500 }]);
    expect(sabtProfit(parseSabt("продажа 500"))).toBe(500);
  });

  it("reads sales and expenses by category", () => {
    expect(summary("Продал 1200, выручка 300, такси 30, мука 2 мешка 600, зарплата 150, аренда 500")).toEqual([
      { title: "Продажа", kind: "income", category: "SALE", amount: 1200 },
      { title: "Продажа", kind: "income", category: "SALE", amount: 300 },
      { title: "Такси", kind: "expense", category: "TRANSPORT", amount: 30 },
      { title: "Мука", kind: "expense", category: "GOODS", amount: 600 },
      { title: "Зарплата", kind: "expense", category: "SALARY", amount: 150 },
      { title: "Аренда", kind: "expense", category: "RENT", amount: 500 },
    ]);
  });

  it("keeps a Russian debt out of the receipt", () => {
    expect(cashSabtEntries(parseSabt("Рахим 120 в долг"))).toEqual([]);
  });
});

describe("parseSabt in English", () => {
  it("reads sale, sold and revenue as income", () => {
    expect(summary("sale 500, sold 200, revenue 100")).toEqual([
      { title: "Sale", kind: "income", category: "SALE", amount: 500 },
      { title: "Sale", kind: "income", category: "SALE", amount: 200 },
      { title: "Sale", kind: "income", category: "SALE", amount: 100 },
    ]);
  });

  it("reads expenses by category", () => {
    expect(summary("Taxi 30, flour 2 bags 600, salary 150, rent 500")).toEqual([
      { title: "Taxi", kind: "expense", category: "TRANSPORT", amount: 30 },
      { title: "Flour", kind: "expense", category: "GOODS", amount: 600 },
      { title: "Salary", kind: "expense", category: "SALARY", amount: 150 },
      { title: "Rent", kind: "expense", category: "RENT", amount: 500 },
    ]);
    expect(sabtProfit(parseSabt("sale 1000, taxi 30, rent 500"))).toBe(470);
  });

  it("does not take salary for a sale or «current» for rent", () => {
    expect(summary("salary 150")[0]).toMatchObject({ kind: "expense", category: "SALARY" });
    expect(summary("current bill 90")[0]).toMatchObject({ kind: "expense", category: "OTHER" });
  });

  it("keeps an English debt out of the receipt", () => {
    expect(cashSabtEntries(parseSabt("John owes 120"))).toEqual([]);
  });

  it("saves English entries with their categories", () => {
    expect(toCashEntriesPayload(parseSabt("sold 250, rent 100"), "TEXT")).toEqual({
      entries: [
        { kind: "INCOME", category: "SALE", amount: "250.00", title: "Sale", source: "TEXT" },
        { kind: "EXPENSE", category: "RENT", amount: "100.00", title: "Rent", source: "TEXT" },
      ],
    });
  });
});
