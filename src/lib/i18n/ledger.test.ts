import { describe, expect, it } from "vitest";
import type { ApiCashEntry, ApiCustomer, ApiDebt, ApiPaymentListItem } from "@/lib/api/types";
import { LOCALES } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { createPlural, createT } from "@/lib/i18n/translate";
import {
  buildLedgerEntries,
  categoryLabel,
  dayLabel,
  entryAmountText,
  expensesByCategory,
  ledgerCsv,
  matchesQuery,
  monthName,
  monthTitle,
  type LedgerApiData,
  type LedgerCategory,
} from "@/lib/ledger";

const CYRILLIC = /[Ѐ-ӿ]/;
const TAJIK_LETTERS = /[ӣӯҳқғҷӢӮҲҚҒҶ]/;
const NBSP = " ";
const CUSTOMER = "00000000-0000-4000-8000-0000000000c1";

function leaves(node: object): string[] {
  return Object.values(node).flatMap((value) => (typeof value === "string" ? [value] : leaves(value as object)));
}

function cash(overrides: Partial<ApiCashEntry>): ApiCashEntry {
  return {
    id: "cash",
    kind: "INCOME",
    category: "SALE",
    amount: "1250.50",
    title: "Фурӯши рӯз",
    occurredOn: "2026-10-30",
    source: "TEXT",
    createdAt: "2026-10-30T04:00:00.000Z",
    ...overrides,
  };
}

const debt: ApiDebt = {
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
};

const payment: ApiPaymentListItem = {
  id: "pay",
  debtId: "debt",
  amount: "50.00",
  paidOn: "2026-10-25",
  note: null,
  createdAt: "2026-10-25T10:00:00.000Z",
  debt: { id: "debt", description: "Орд", occurredOn: "2026-10-20" },
  customer: { id: CUSTOMER, name: "Зафар Мирзоев" },
};

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
      cash({ id: "sale" }),
      cash({ id: "taxi", kind: "EXPENSE", category: "TRANSPORT", amount: "30.25", title: "Такси", occurredOn: "2026-10-29" }),
      cash({ id: "rent", kind: "EXPENSE", category: "RENT", amount: "500.00", title: "Иҷораи дӯкон", occurredOn: "2026-10-28" }),
    ],
    debts: [debt],
    payments: [payment],
    customers: [customer],
    ...overrides,
  };
}

describe("Ledger screen texts", () => {
  it("are filled in and really translated", () => {
    for (const locale of LOCALES) for (const text of leaves(dictionaries[locale].ledger)) expect(text.trim()).not.toBe("");
    for (const text of leaves(dictionaries.en.ledger)) expect(text).not.toMatch(CYRILLIC);
    for (const text of leaves(dictionaries.ru.ledger)) expect(text).not.toMatch(TAJIK_LETTERS);
  });

  it("keep the original Tajik texts", () => {
    const t = createT("tg");
    expect(t("ledger.filters.income")).toBe("+ Даромад");
    expect(t("ledger.searchPlaceholder")).toBe("Ҷустуҷӯ: «орд», «такси»…");
    expect(t("ledger.panel.profitHint")).toBe("Фоида = даромад − хароҷот. Насия ба фоида дохил намешавад.");
    expect(t("ledger.heading", { month: monthName("2026-10") })).toBe("Дафтари октябр");
    expect(createPlural("tg")("ledger.count", 6)).toBe("6 сабт");
  });

  it("translate the filters, headings and month panel", () => {
    expect(["all", "income", "expense", "debt"].map((id) => createT("ru")(`ledger.filters.${id}` as never))).toEqual(["Все", "+ Доход", "− Расход", "Долги"]);
    expect(["all", "income", "expense", "debt"].map((id) => createT("en")(`ledger.filters.${id}` as never))).toEqual(["All", "+ Income", "− Expenses", "Debts"]);
    expect(createT("ru")("ledger.heading", { month: monthName("2026-10", "ru") })).toBe("Журнал за октябрь");
    expect(createT("en")("ledger.heading", { month: monthName("2026-10", "en") })).toBe("October ledger");
    expect(createT("ru")("ledger.panel.title", { month: monthName("2026-05", "ru") })).toBe("За май");
    expect(createT("en")("ledger.panel.whereWent")).toBe("Where did the money go?");
  });

  it("count entries with the right word form", () => {
    expect(createPlural("ru")("ledger.count", 1)).toBe("1 запись");
    expect(createPlural("ru")("ledger.count", 3)).toBe("3 записи");
    expect(createPlural("ru")("ledger.count", 25)).toBe("25 записей");
    expect(createPlural("en")("ledger.count", 1)).toBe("1 entry");
    expect(createPlural("en")("ledger.count", 0)).toBe("0 entries");
  });
});

describe("Ledger labels per language", () => {
  it("name every category", () => {
    const categories: LedgerCategory[] = ["sale", "goods", "salary", "utilities", "transport", "rent", "other", "debt"];
    expect(categories.map((category) => categoryLabel(category))).toEqual(["фурӯш", "мол", "маош", "коммуналӣ", "роҳкиро", "иҷора", "дигар", "насия"]);
    expect(categories.map((category) => categoryLabel(category, "en"))).toEqual(["sale", "goods", "wages", "utilities", "transport", "rent", "other", "debt"]);
    expect(categoryLabel("transport", "ru")).toBe("проезд");
  });

  it("title the month select in each language", () => {
    expect(monthTitle("2026-10")).toBe("Октябр 2026");
    expect(monthTitle("2026-10", "ru")).toBe("Октябрь 2026");
    expect(monthTitle("2026-10", "en")).toBe("October 2026");
  });

  it("label today, yesterday and older days", () => {
    expect(dayLabel("2026-10-30", "2026-10-30")).toBe("Имрӯз, 30 октябр");
    expect(dayLabel("2026-10-29", "2026-10-30", "ru")).toBe("Вчера, 29 октября");
    expect(dayLabel("2026-10-30", "2026-10-30", "en")).toBe("Today, October 30");
    expect(dayLabel("2026-10-01", "2026-10-30", "en")).toBe("October 1");
  });

  it("format amounts in the chosen language", () => {
    const [sale, taxi] = buildLedgerEntries(data(), "2026-10");
    expect(entryAmountText(sale)).toBe(`+1${NBSP}250.50`);
    expect(entryAmountText(sale, "ru")).toBe(`+1${NBSP}250,50`);
    expect(entryAmountText(sale, "en")).toBe("+1,250.50");
    expect(entryAmountText(taxi, "ru")).toBe("−30,25");
  });
});

describe("debt rows keep user data and translate only the words around it", () => {
  it("in every language", () => {
    const titles = (locale: (typeof LOCALES)[number]) =>
      buildLedgerEntries(data(), "2026-10", locale)
        .filter((entry) => entry.category === "debt")
        .map((entry) => entry.title);
    expect(titles("tg")).toEqual(["Зафар Мирзоев насия гирифт: Орд", "Зафар Мирзоев қарзашро баргардонд"]);
    expect(titles("ru")).toEqual(["Зафар Мирзоев — в долг: Орд", "Зафар Мирзоев — долг возвращён"]);
    expect(titles("en")).toEqual(["Зафар Мирзоев took on credit: Орд", "Зафар Мирзоев paid back the debt"]);
  });

  it("name an unknown customer per language", () => {
    const [entry] = buildLedgerEntries(data({ cashEntries: [], payments: [], customers: [] }), "2026-10", "en");
    expect(entry.title).toBe("Customer took on credit: Орд");
  });

  it("leave cash entry titles untouched", () => {
    expect(buildLedgerEntries(data(), "2026-10", "en").map((entry) => entry.title).slice(0, 3)).toEqual(["Фурӯши рӯз", "Такси", "Иҷораи дӯкон"]);
  });
});

describe("search and expense groups in the chosen language", () => {
  const entries = buildLedgerEntries(data(), "2026-10", "ru");
  const ids = (list: typeof entries) => list.map((entry) => entry.id);

  it("finds entries by the shown category name and amount", () => {
    expect(ids(entries.filter((entry) => matchesQuery(entry, "аренда", "ru")))).toEqual(["rent"]);
    expect(ids(entries.filter((entry) => matchesQuery(entry, "rent", "en")))).toEqual(["rent"]);
    expect(ids(entries.filter((entry) => matchesQuery(entry, "иҷора")))).toEqual(["rent"]);
    expect(ids(entries.filter((entry) => matchesQuery(entry, "1,250", "en")))).toEqual(["sale"]);
    expect(ids(entries.filter((entry) => matchesQuery(entry, "такси", "ru")))).toEqual(["taxi"]);
  });

  it("labels expense groups without changing their order", () => {
    expect(expensesByCategory(entries, "ru").map(({ label, amount }) => ({ label, amount }))).toEqual([
      { label: "аренда", amount: 50_000 },
      { label: "проезд", amount: 3_025 },
    ]);
    expect(expensesByCategory(entries, "en").map((group) => group.category)).toEqual(expensesByCategory(entries).map((group) => group.category));
  });
});

describe("CSV export", () => {
  it("translates headers, types and categories", () => {
    const entries = buildLedgerEntries(data({ debts: [], payments: [] }), "2026-10", "en");
    const [header, first] = ledgerCsv(entries, "en").split("\r\n");
    expect(header).toBe('"Date";"Time";"Entry";"Type";"Category";"Amount"');
    expect(first).toBe('"2026-10-28";"09:00";"Иҷораи дӯкон";"expense";"rent";"−500"');
    expect(ledgerCsv(entries, "ru").split("\r\n")[0]).toBe('"Дата";"Время";"Запись";"Тип";"Категория";"Сумма"');
    expect(ledgerCsv(entries).split("\r\n")[0]).toBe('"Сана";"Вақт";"Сабт";"Навъ";"Категория";"Маблағ"');
  });
});
