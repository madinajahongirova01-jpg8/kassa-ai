import { describe, expect, it, vi } from "vitest";
import type { ApiReportDay, ApiReportSummary } from "@/lib/api/types";
import {
  buildPeriodReport,
  extremeDays,
  fetchReportData,
  monthBars,
  periodRange,
  periodTotals,
  reportCsv,
  reportFileName,
  reportRange,
  toReportDays,
  weekBars,
  weekdayDate,
  type ReportApi,
  type ReportData,
} from "@/lib/hisobot";

const TODAY = "2026-10-30";

function apiDay(date: string, overrides: Partial<ApiReportDay> = {}): ApiReportDay {
  return { date, income: "0.00", expense: "0.00", profit: "0.00", salesCount: 0, debtGiven: "0.00", debtReturned: "0.00", debtReturnedByMethod: { CASH: "0.00", CARD: "0.00", TRANSFER: "0.00" }, ...overrides };
}

function summary(days: ApiReportDay[]): ApiReportSummary {
  return {
    from: "2025-11-01",
    to: TODAY,
    today: TODAY,
    days,
    expenseByCategory: [],
    debtReturnedByMethod: { CASH: "0.00", CARD: "0.00", TRANSFER: "0.00" },
    totals: { income: "0.00", expense: "0.00", profit: "0.00", salesCount: 0, entriesCount: 0, debtGiven: "0.00", debtReturned: "0.00" },
  };
}

const sample = summary([
  apiDay("2026-01-10", { income: "500.00", expense: "200.00" }),
  apiDay("2026-08-05", { income: "1000.00", expense: "400.00" }),
  apiDay("2026-09-15", { income: "800.00", expense: "300.00", debtReturned: "40.00", debtReturnedByMethod: { CASH: "40.00", CARD: "0.00", TRANSFER: "0.00" } }),
  apiDay("2026-10-02", { income: "1250.50", expense: "250.25" }),
  apiDay("2026-10-20", { debtGiven: "120.00" }),
  apiDay("2026-10-25", { income: "300.00", expense: "500.00", debtReturned: "70.00", debtReturnedByMethod: { CASH: "20.00", CARD: "50.00", TRANSFER: "0.00" } }),
  apiDay("2026-10-29", { income: "900.00", expense: "100.00" }),
  apiDay("2026-10-30", { income: "200.00", debtReturned: "30.00", debtReturnedByMethod: { CASH: "0.00", CARD: "0.00", TRANSFER: "30.00" } }),
]);

function data(): ReportData {
  return { today: TODAY, days: toReportDays(sample) };
}

describe("toReportDays", () => {
  it("turns API amounts into dirams and calculates profit without debts", () => {
    expect(toReportDays(summary([apiDay("2026-10-30", { income: "1250.50", expense: "250.25", debtGiven: "100.00", debtReturned: "70.00", debtReturnedByMethod: { CASH: "10.50", CARD: "59.50", TRANSFER: "0.00" } })]))).toEqual([
      {
        date: "2026-10-30",
        income: 125_050,
        expense: 25_025,
        profit: 100_025,
        debtGiven: 10_000,
        debtReturned: 7_000,
        debtReturnedByMethod: { CASH: 1_050, CARD: 5_950, TRANSFER: 0 },
        hasCash: true,
      },
    ]);
  });

  it("marks days with only debts as days without cash", () => {
    expect(toReportDays(summary([apiDay("2026-10-20", { debtGiven: "120.00" })]))[0].hasCash).toBe(false);
  });

  it("rejects amounts in an unexpected format", () => {
    expect(() => toReportDays(summary([apiDay("2026-10-20", { income: "12" })]))).toThrow(RangeError);
  });
});

describe("periods", () => {
  it("covers the last 7 days, this month and this year", () => {
    expect(periodRange("week", TODAY)).toEqual({ from: "2026-10-24", to: TODAY });
    expect(periodRange("month", TODAY)).toEqual({ from: "2026-10-01", to: TODAY });
    expect(periodRange("year", TODAY)).toEqual({ from: "2026-01-01", to: TODAY });
  });

  it("asks the API for at most 366 days that include every period", () => {
    expect(reportRange(TODAY)).toEqual({ from: "2025-11-01", to: TODAY });
    expect(reportRange("2028-12-31")).toEqual({ from: "2028-01-01", to: "2028-12-31" });
  });

  it("profit is income minus expense for each period", () => {
    expect(buildPeriodReport(data(), "week")).toMatchObject({ income: 140_000, expense: 60_000, profit: 80_000 });
    expect(buildPeriodReport(data(), "month")).toMatchObject({ income: 265_050, expense: 85_025, profit: 180_025 });
    expect(buildPeriodReport(data(), "year")).toMatchObject({ income: 495_050, expense: 175_025, profit: 320_025 });
  });

  it("debt repayments are counted separately and do not raise profit", () => {
    const month = buildPeriodReport(data(), "month");
    expect(month).toMatchObject({ debtGiven: 12_000, debtReturned: 10_000 });
    expect(month.debtReturnedByMethod).toEqual({ CASH: 2_000, CARD: 5_000, TRANSFER: 3_000 });
    expect(buildPeriodReport(data(), "year").debtReturnedByMethod).toEqual({ CASH: 6_000, CARD: 5_000, TRANSFER: 3_000 });
    expect(buildPeriodReport(data(), "week").debtReturnedByMethod).toEqual({ CASH: 2_000, CARD: 5_000, TRANSFER: 3_000 });
    expect(periodTotals(month.days).profit).toBe(180_025);
  });

  it("compares the month with the previous one only when it has records", () => {
    expect(buildPeriodReport(data(), "month").note).toMatch(/^аз сентябр 1\s300\.25 зиёд$/);
    expect(buildPeriodReport({ today: TODAY, days: toReportDays(summary([apiDay(TODAY, { income: "10.00" })])) }, "month").note).toBeNull();
  });
});

describe("charts", () => {
  it("shows month by month profit from the first month with records", () => {
    const bars = buildPeriodReport(data(), "month").bars;
    expect(bars.map((bar) => [bar.label, bar.value, bar.current ?? false])).toEqual([
      ["Авг", 60_000, false],
      ["Сен", 50_000, false],
      ["Окт", 180_025, true],
    ]);
  });

  it("shows every month of the year since the first record, including empty ones as zero", () => {
    const bars = buildPeriodReport(data(), "year").bars;
    expect(bars).toHaveLength(10);
    expect(bars[0]).toEqual({ label: "Янв", value: 30_000, current: false });
    expect(bars[1]).toEqual({ label: "Фев", value: 0, current: false });
  });

  it("shows the last 7 days for the week", () => {
    const bars = weekBars(data().days, TODAY);
    expect(bars.map((bar) => bar.label)).toEqual(["Шн", "Яш", "Дш", "Сш", "Чш", "Пш", "Ҷм"]);
    expect(bars.map((bar) => bar.value)).toEqual([0, -20_000, 0, 0, 0, 80_000, 20_000]);
    expect(bars[6].current).toBe(true);
  });

  it("is empty without records", () => {
    expect(monthBars([], ["2026-09", "2026-10"])).toEqual([]);
    const empty = buildPeriodReport({ today: TODAY, days: [] }, "week");
    expect(empty).toMatchObject({ bars: [], profit: 0, hasCash: false, best: null, worst: null, note: null });
  });
});

describe("best and worst day", () => {
  it("finds the days with the highest and lowest profit in the period", () => {
    const month = buildPeriodReport(data(), "month");
    expect(month.best).toEqual({ date: "2026-10-02", profit: 100_025 });
    expect(month.worst).toEqual({ date: "2026-10-25", profit: -20_000 });
    expect(weekdayDate("2026-10-25")).toBe("Якшанбе, 25 октябр");
  });

  it("ignores days with only debts and needs two days to name the worst one", () => {
    const days = toReportDays(summary([apiDay("2026-10-20", { debtGiven: "120.00" }), apiDay(TODAY, { income: "50.00" })]));
    expect(extremeDays(days)).toEqual({ best: { date: TODAY, profit: 5_000 }, worst: null });
    expect(extremeDays([])).toEqual({ best: null, worst: null });
  });
});

describe("export", () => {
  it("exports the days of the period with exact amounts and a total row", () => {
    const week = buildPeriodReport(data(), "week");
    expect(reportCsv(week).split("\r\n")).toEqual([
      '"Сана";"Даромад";"Хароҷот";"Фоида";"Насия дода шуд";"Насия баргашт"',
      '"2026-10-25";"300.00";"500.00";"-200.00";"0.00";"70.00"',
      '"2026-10-29";"900.00";"100.00";"800.00";"0.00";"0.00"',
      '"2026-10-30";"200.00";"0.00";"200.00";"0.00";"30.00"',
      '"Ҳамагӣ";"1400.00";"600.00";"800.00";"0.00";"100.00"',
    ]);
    expect(reportFileName(week)).toBe("kassa-hisobot-2026-10-24-2026-10-30.csv");
  });
});

describe("fetchReportData", () => {
  it("loads one summary for the last 12 months and uses the API business day", async () => {
    const get = vi.fn(async () => ({ ...sample, today: "2026-10-31" }));
    const result = await fetchReportData(TODAY, { get: get as unknown as ReportApi["get"] });
    expect(get).toHaveBeenCalledWith("/reports/summary?from=2025-11-01&to=2026-10-30");
    expect(result.today).toBe("2026-10-31");
    expect(result.days).toHaveLength(8);
  });

  it("does not hide API errors behind an empty report", async () => {
    const get = (async () => Promise.reject(new Error("API 500"))) as ReportApi["get"];
    await expect(fetchReportData(TODAY, { get })).rejects.toThrow("API 500");
  });
});
