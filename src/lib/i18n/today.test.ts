import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { createPlural, createT, pluralForm } from "@/lib/i18n/translate";

const CYRILLIC = /[Ѐ-ӿ]/;

function leaves(node: object): string[] {
  return Object.values(node).flatMap((value) => (typeof value === "string" ? [value] : leaves(value as object)));
}

describe("pluralForm", () => {
  it("uses Russian one/few/many rules", () => {
    expect([1, 21, 101].map((n) => pluralForm("ru", n))).toEqual(["one", "one", "one"]);
    expect([2, 3, 4, 22, 104].map((n) => pluralForm("ru", n))).toEqual(["few", "few", "few", "few", "few"]);
    expect([0, 5, 11, 12, 14, 19, 100, 111].map((n) => pluralForm("ru", n))).toEqual(Array(8).fill("many"));
  });

  it("uses English one/other and one Tajik form", () => {
    expect(pluralForm("en", 1)).toBe("one");
    expect(pluralForm("en", 0)).toBe("other");
    expect(pluralForm("en", 2)).toBe("other");
    expect(pluralForm("tg", 1)).toBe("other");
    expect(pluralForm("tg", 5)).toBe("other");
  });

  it("counts negative numbers by their size", () => {
    expect(pluralForm("ru", -3)).toBe("few");
    expect(pluralForm("en", -1)).toBe("one");
  });
});

describe("Today screen texts", () => {
  it("are filled in for every language", () => {
    for (const locale of LOCALES) {
      for (const text of [...leaves(dictionaries[locale].today), ...leaves(dictionaries[locale].common)]) {
        expect(text.trim()).not.toBe("");
      }
    }
  });

  it("are really translated: no Cyrillic in English, no Tajik-only letters in Russian", () => {
    for (const text of [...leaves(dictionaries.en.today), ...leaves(dictionaries.en.common)]) expect(text).not.toMatch(CYRILLIC);
    for (const text of [...leaves(dictionaries.ru.today), ...leaves(dictionaries.ru.common)]) expect(text).not.toMatch(/[ӣӯҳқғҷӢӮҲҚҒҶ]/);
  });

  it("keep the original Tajik texts", () => {
    const t = createT("tg");
    expect(t("today.summary.lead")).toBe("Имрӯз шумо…");
    expect(t("today.entries.empty")).toBe("Имрӯз ҳоло сабт нест.");
    expect(t("today.debts.all")).toBe("Ҳамаи қарзҳо →");
    expect(t("common.demoData")).toBe("Маълумоти намунавӣ");
    expect(t("common.error.retry")).toBe("Боз кӯшиш");
  });

  it("translate headings and buttons", () => {
    expect(createT("ru")("today.entries.title")).toBe("Записи за сегодня");
    expect(createT("en")("today.entries.title")).toBe("Today's entries");
    expect(createT("ru")("today.debts.title")).toBe("Вам должны");
    expect(createT("en")("today.debts.title")).toBe("Owed to you");
    expect(createT("ru")("common.error.retry")).toBe("Повторить");
    expect(createT("en")("common.error.retry")).toBe("Try again");
  });

  it("fill the due date", () => {
    expect(createT("tg")("today.debts.dueBy", { date: "5 май" })).toBe("то 5 май");
    expect(createT("ru")("today.debts.dueBy", { date: "5 мая" })).toBe("до 5 мая");
    expect(createT("en")("today.debts.dueBy", { date: "May 5" })).toBe("due May 5");
  });

  it("count debtors and overdue days with the right word form", () => {
    const tg = createPlural("tg");
    const ru = createPlural("ru");
    const en = createPlural("en");
    expect(tg("today.debts.people", 3)).toBe("3 нафар");
    expect(ru("today.debts.people", 1)).toBe("1 человек");
    expect(ru("today.debts.people", 3)).toBe("3 человека");
    expect(ru("today.debts.people", 5)).toBe("5 человек");
    expect(en("today.debts.people", 1)).toBe("1 person");
    expect(en("today.debts.people", 4)).toBe("4 people");
    expect(tg("today.debts.overdue", 2)).toBe("2 рӯз гузашт — занг занед!");
    expect(ru("today.debts.overdue", 21)).toBe("просрочено на 21 день — позвоните!");
    expect(ru("today.debts.overdue", 2)).toBe("просрочено на 2 дня — позвоните!");
    expect(ru("today.debts.overdue", 11)).toBe("просрочено на 11 дней — позвоните!");
    expect(en("today.debts.overdue", 1)).toBe("1 day overdue — call now!");
    expect(en("today.debts.overdue", 7)).toBe("7 days overdue — call now!");
  });
});
