import { describe, expect, it } from "vitest";
import { weekdayName } from "@/lib/format";
import { buildPeriodReport, monthBars, reportCsv, shortMonth, weekBars, weekdayDate, type ReportDay } from "@/lib/hisobot";
import { LOCALES } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/translate";

const CYRILLIC = /[Ѐ-ӿ]/;
const TAJIK_LETTERS = /[ӣӯҳқғҷӢӮҲҚҒҶ]/;
const NBSP = " ";
const TODAY = "2026-10-30";

function leaves(node: object): string[] {
  return Object.values(node).flatMap((value) => (typeof value === "string" ? [value] : leaves(value as object)));
}

function day(date: string, income: number, expense: number, debtGiven = 0, debtReturned = 0): ReportDay {
  return {
    date,
    income,
    expense,
    profit: income - expense,
    debtGiven,
    debtReturned,
    debtReturnedByMethod: { CASH: debtReturned, CARD: 0, TRANSFER: 0 },
    hasCash: income > 0 || expense > 0,
  };
}

const data = {
  today: TODAY,
  days: [day("2026-09-10", 100_000, 40_000), day("2026-10-02", 150_000, 20_000, 5_000), day("2026-10-28", 10_000, 30_000, 0, 7_000), day(TODAY, 50_000, 0)],
};

describe("Reports screen texts", () => {
  it("are filled in and really translated", () => {
    for (const locale of LOCALES) for (const text of leaves(dictionaries[locale].report)) expect(text.trim()).not.toBe("");
    for (const text of leaves(dictionaries.en.report)) expect(text).not.toMatch(CYRILLIC);
    for (const text of leaves(dictionaries.ru.report)) expect(text).not.toMatch(TAJIK_LETTERS);
  });

  it("translate periods and the result line", () => {
    expect(["week", "month", "year"].map((id) => createT("ru")(`report.periods.${id}` as never))).toEqual(["Неделя", "Месяц", "Год"]);
    expect(["week", "month", "year"].map((id) => createT("en")(`report.periods.${id}` as never))).toEqual(["Week", "Month", "Year"]);
    expect(createT("tg")("report.gained")).toBe("сомонӣ фоида кардед.");
    expect(createT("ru")("report.lost")).toBe("сомони убытка.");
  });
});

describe("weekdays", () => {
  it("are named in every language, Sunday first", () => {
    expect([0, 6].map((index) => weekdayName(index))).toEqual(["якшанбе", "шанбе"]);
    expect([0, 1].map((index) => weekdayName(index, "ru", "short"))).toEqual(["Вс", "Пн"]);
    expect(weekdayName(5, "en")).toBe("Friday");
    expect(weekdayDate("2026-10-25", "ru")).toBe("Воскресенье, 25 октября");
    expect(weekdayDate("2026-10-25", "en")).toBe("Sunday, October 25");
  });
});

describe("period report per language", () => {
  it("keeps the Tajik texts by default", () => {
    const month = buildPeriodReport(data, "month");
    expect(month.lead).toBe("Дар октябр шумо…");
    expect(month.chartTitle).toBe("Фоида моҳ ба моҳ");
    expect(month.chartNote).toBe("2 моҳи охир");
    expect(month.note).toBe(`аз сентябр 1${NBSP}000 зиёд`);
    expect(buildPeriodReport(data, "week").chartNote).toBe("ҷумъа беҳтарин рӯз буд");
  });

  it("builds the month report in Russian and English", () => {
    const ru = buildPeriodReport(data, "month", "ru");
    expect(ru.lead).toBe("За октябрь у вас…");
    expect(ru.note).toBe(`на 1${NBSP}000 больше, чем за сентябрь`);
    expect(ru.chartNote).toBe("2 последних месяца");
    const en = buildPeriodReport(data, "month", "en");
    expect(en.lead).toBe("In October you made…");
    expect(en.note).toBe("1,000 more than September");
    expect(en.chartTitle).toBe("Profit month by month");
  });

  it("builds the week and year reports in every language", () => {
    expect(buildPeriodReport(data, "week", "ru").chartNote).toBe("пятница — лучший день");
    expect(buildPeriodReport(data, "week", "en").lead).toBe("In the last 7 days you made…");
    expect(buildPeriodReport(data, "year", "ru").lead).toBe("За 2026 год у вас…");
    expect(buildPeriodReport(data, "year", "en").chartNote).toBe("2 months of the year");
    expect(buildPeriodReport({ today: TODAY, days: [] }, "year", "en").chartNote).toBe("2026");
  });

  it("keeps the numbers the same in every language", () => {
    const totals = LOCALES.map((locale) => {
      const report = buildPeriodReport(data, "month", locale);
      return [report.income, report.expense, report.profit, report.debtGiven, report.debtReturned];
    });
    expect(new Set(totals.map((row) => row.join())).size).toBe(1);
  });
});

describe("chart labels", () => {
  it("use short weekday and month names of the language", () => {
    expect(weekBars(data.days, TODAY, "en").map((bar) => bar.label)).toEqual(["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]);
    expect(monthBars(data.days, ["2026-09", "2026-10"], "ru").map((bar) => bar.label)).toEqual(["Сен", "Окт"]);
    expect(shortMonth("2026-05", "en")).toBe("May");
  });
});

describe("CSV export", () => {
  it("translates the header and total row only", () => {
    const report = buildPeriodReport(data, "week", "en");
    const rows = reportCsv(report, "en").split("\r\n");
    expect(rows[0]).toBe('"Date";"Income";"Expenses";"Profit";"Debts given";"Debts repaid"');
    expect(rows[rows.length - 1]).toBe('"Total";"600.00";"300.00";"300.00";"0.00";"70.00"');
    expect(reportCsv(report, "ru").split("\r\n")[0]).toBe('"Дата";"Доход";"Расход";"Прибыль";"Выдано в долг";"Возвращено долгов"');
  });
});
