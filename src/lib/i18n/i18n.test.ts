import { describe, expect, it } from "vitest";
import { formatDate, formatDayMonth, formatMoney, formatMonth, formatNumber, formatSomoni, monthName, monthNames } from "@/lib/format";
import { DEFAULT_LOCALE, isLocale, localeCookie, LOCALES, resolveLocale, stripLocalePrefix } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/translate";

const NBSP = " ";

function keysOf(node: object, prefix = ""): string[] {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === "string" ? [`${prefix}${key}`] : keysOf(value as object, `${prefix}${key}.`),
  );
}

describe("locale config", () => {
  it("defaults to Tajik", () => {
    expect(DEFAULT_LOCALE).toBe("tg");
    expect(LOCALES).toEqual(["tg", "ru", "en"]);
  });

  it("accepts only supported cookie values", () => {
    expect(resolveLocale("ru")).toBe("ru");
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale(undefined)).toBe("tg");
    expect(resolveLocale("")).toBe("tg");
    expect(resolveLocale("de")).toBe("tg");
    expect(resolveLocale("RU")).toBe("tg");
    expect(isLocale("toString")).toBe(false);
  });

  it("builds a site-wide cookie that lasts a year", () => {
    expect(localeCookie("ru")).toBe("kassa_lang=ru; Path=/; Max-Age=31536000; SameSite=Lax");
  });

  it("strips only a whole internal locale segment", () => {
    expect(stripLocalePrefix("/tg")).toBe("/");
    expect(stripLocalePrefix("/ru/app/debts")).toBe("/app/debts");
    expect(stripLocalePrefix("/en/app")).toBe("/app");
    expect(stripLocalePrefix("/app/debts")).toBe("/app/debts");
    expect(stripLocalePrefix("/english")).toBe("/english");
    expect(stripLocalePrefix("/")).toBe("/");
  });
});

describe("dictionaries", () => {
  it("have the same keys in every language and no empty texts", () => {
    const source = keysOf(dictionaries.tg).sort();
    for (const locale of LOCALES) {
      expect(keysOf(dictionaries[locale]).sort()).toEqual(source);
      for (const key of source) expect(createT(locale)(key as never).trim()).not.toBe("");
    }
  });
});

describe("t()", () => {
  it("returns the text for the chosen language", () => {
    expect(createT("tg")("nav.today")).toBe("Имрӯз");
    expect(createT("ru")("nav.today")).toBe("Сегодня");
    expect(createT("en")("nav.today")).toBe("Today");
  });

  it("falls back to the key when a text is missing everywhere", () => {
    expect(createT("ru")("nav.unknown" as never)).toBe("nav.unknown");
    expect(createT("en")("nav" as never)).toBe("nav");
  });

  it("fills placeholders and keeps unknown ones", () => {
    const original = dictionaries.en.nav.today;
    dictionaries.en.nav.today = "Today, {name}: {count} {missing}";
    try {
      expect(createT("en")("nav.today", { name: "Ali", count: 3 })).toBe("Today, Ali: 3 {missing}");
    } finally {
      dictionaries.en.nav.today = original;
    }
  });
});

describe("number and money formats", () => {
  it("keeps the original Tajik format by default", () => {
    expect(formatNumber(1250)).toBe(`1${NBSP}250`);
    expect(formatMoney(125050)).toBe(`1${NBSP}250.50 смн`);
    expect(formatSomoni(-1250, { unit: false })).toBe(`−1${NBSP}250`);
  });

  it("uses each language's separators and currency unit", () => {
    expect(formatNumber(1234567.891, 2, "ru")).toBe(`1${NBSP}234${NBSP}567,89`);
    expect(formatNumber(1234567.891, 2, "en")).toBe("1,234,567.89");
    expect(formatMoney(125050, { locale: "ru" })).toBe(`1${NBSP}250,50 смн`);
    expect(formatMoney(125050, { locale: "en", sign: true })).toBe("+1,250.50 TJS");
    expect(formatSomoni(-5, { locale: "en" })).toBe("−5 TJS");
  });
});

describe("month and date formats", () => {
  it("keeps the Tajik month list", () => {
    expect(monthNames).toHaveLength(12);
    expect(monthNames[9]).toBe("октябр");
  });

  it("names months per language and form", () => {
    for (const locale of LOCALES) expect(monthName(0, locale)).toBeTruthy();
    expect(monthName(9, "ru")).toBe("октябрь");
    expect(monthName(9, "ru", "day")).toBe("октября");
    expect(monthName(9, "en")).toBe("October");
    expect(monthName(12, "en")).toBeUndefined();
  });

  it("formats day-month, full dates and months", () => {
    expect(formatDayMonth("2026-10-30")).toBe("30 октябр");
    expect(formatDayMonth("2026-05-01", "ru")).toBe("1 мая");
    expect(formatDayMonth("2026-05-01", "en")).toBe("May 1");
    expect(formatDate("2026-10-30", "tg")).toBe("30 октябр 2026");
    expect(formatDate("2026-10-30", "ru")).toBe("30 октября 2026");
    expect(formatDate("2026-10-30", "en")).toBe("October 30, 2026");
    expect(formatMonth("2026-10", "ru")).toBe("октябрь 2026");
    expect(formatMonth("2026-13", "en")).toBe("2026-13");
  });
});
