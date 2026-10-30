import { describe, expect, it } from "vitest";
import { adminUser } from "@/data/admin";
import { adminMobileNav, adminSidebarNav } from "@/data/navigation";
import { LOCALES } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/translate";

const CYRILLIC = /[Ѐ-ӿ]/;
const TAJIK_LETTERS = /[ӣӯҳқғҷӢӮҲҚҒҶ]/;

describe("Admin texts", () => {
  it("are filled in and really translated", () => {
    for (const locale of LOCALES) for (const text of Object.values(dictionaries[locale].admin)) expect(text.trim()).not.toBe("");
    for (const text of Object.values(dictionaries.en.admin)) expect(text).not.toMatch(CYRILLIC);
    for (const text of Object.values(dictionaries.ru.admin)) expect(text).not.toMatch(TAJIK_LETTERS);
  });

  it("name the admin menus and placeholder profile in every language", () => {
    expect(adminSidebarNav.map((item) => createT("tg")(item.labelKey))).toEqual(["Шарҳи умумӣ"]);
    expect(adminSidebarNav.map((item) => createT("ru")(item.labelKey))).toEqual(["Обзор"]);
    expect(adminMobileNav.map((item) => createT("en")(item.labelKey))).toEqual(["Dashboard"]);
    expect([createT("en")(adminUser.nameKey), createT("en")(adminUser.roleKey)]).toEqual(["Administrator", "Control panel"]);
    expect(createT("tg")(adminUser.nameKey)).toBe("Маъмур");
  });
});
