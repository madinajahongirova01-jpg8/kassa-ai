import { describe, expect, it } from "vitest";
import { appFeatures, plans } from "@/data/pricing";
import { sabtDemo } from "@/data/sabt";
import { formatDayMonth } from "@/lib/format";
import { LOCALES } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { createPlural, createT } from "@/lib/i18n/translate";

const CYRILLIC = /[Ѐ-ӿ]/;
const TAJIK_LETTERS = /[ӣӯҳқғҷӢӮҲҚҒҶ]/;

function leaves(node: object): string[] {
  return Object.values(node).flatMap((value) => (typeof value === "string" ? [value] : leaves(value as object)));
}

describe("Landing and Pricing texts", () => {
  it("are filled in and really translated", () => {
    for (const section of ["landing", "pricing"] as const) {
      for (const locale of LOCALES) for (const text of leaves(dictionaries[locale][section])) expect(text.trim()).not.toBe("");
      for (const text of leaves(dictionaries.en[section])) expect(text).not.toMatch(CYRILLIC);
      for (const text of leaves(dictionaries.ru[section])) expect(text).not.toMatch(TAJIK_LETTERS);
    }
  });

  it("keep the original Tajik texts", () => {
    const t = createT("tg");
    expect(t("landing.hero.marker")).toBe("ҳисоб мекунад.");
    expect(t("landing.steps.title")).toBe("Се қадам — ва дафтар тайёр");
    expect(t("landing.openBook")).toBe("Дафтарро кушоед");
    expect(`${t("pricing.titleBefore")}${t("pricing.titleMarker")}${t("pricing.titleAfter")}`).toBe("Тарофаи худро интихоб кунед.");
  });

  it("build the pricing headline around the marked word", () => {
    const title = (locale: (typeof LOCALES)[number]) => {
      const t = createT(locale);
      return `${t("pricing.titleBefore")}${t("pricing.titleMarker")}${t("pricing.titleAfter")}`;
    };
    expect(title("ru")).toBe("Выберите свой тариф.");
    expect(title("en")).toBe("Choose your plan.");
  });
});

describe("plans", () => {
  it("have a name, price, period and audience in every language", () => {
    for (const locale of LOCALES) {
      const t = createT(locale);
      for (const plan of plans) {
        for (const field of ["name", "price", "period", "audience"]) {
          const key = `pricing.plans.${plan.id}.${field}` as never;
          expect(t(key)).not.toBe(key);
        }
      }
    }
  });

  it("keep the numeric prices the same in every language", () => {
    for (const id of ["tijorat", "pro"] as const) {
      expect(new Set(LOCALES.map((locale) => createT(locale)(`pricing.plans.${id}.price`))).size).toBe(1);
    }
    expect(createT("en")("pricing.plans.ogoz.price")).toBe("Free");
    expect(createT("ru")("pricing.plans.tijorat.period")).toBe("смн / мес");
  });

  it("list the app pages with translated names and notes", () => {
    expect(appFeatures.map((feature) => createT("en")(feature.titleKey))).toEqual(["New entry", "Today", "Ledger", "Debts", "Reports"]);
    expect(appFeatures.map((feature) => createT("tg")(feature.noteKey))[0]).toBe("даромад ва хароҷот бо матн");
  });
});

describe("landing samples", () => {
  it("date the sample receipt in the chosen language", () => {
    expect(formatDayMonth(sabtDemo.date)).toBe("24 май");
    expect(formatDayMonth(sabtDemo.date, "ru")).toBe("24 мая");
    expect(formatDayMonth(sabtDemo.date, "en")).toBe("May 24");
  });

  it("reuse the overdue sticker text with the right word form", () => {
    expect(createPlural("tg")("today.debts.overdue", 5)).toBe("5 рӯз гузашт — занг занед!");
    expect(createPlural("ru")("today.debts.overdue", 5)).toBe("просрочено на 5 дней — позвоните!");
  });
});
