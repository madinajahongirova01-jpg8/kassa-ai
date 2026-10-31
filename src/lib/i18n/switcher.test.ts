import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALE_NAMES, localeFromCookies, localeOptionLabel, localeShortLabel, LOCALES } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/translate";

const APP_DIR = join(process.cwd(), "src", "app", "[lang]");
const COMPONENTS_DIR = join(process.cwd(), "src", "components");

// Shared headers that render the language select, and the component that renders each of them.
const HEADERS: Record<string, string> = {
  AppTopBar: "daftar/AppTopBar.tsx",
  AdminHeader: "layout/AdminHeader.tsx",
  LandingHeader: "landing/LandingHeader.tsx",
  PricingHeader: "pricing/PricingHeader.tsx",
  SimpleHeader: "daftar/SimpleHeader.tsx",
  StatusPage: "daftar/StatusPage.tsx",
};

function files(dir: string, name: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return files(path, name);
    return entry === name ? [path] : [];
  });
}

function source(path: string) {
  return readFileSync(path, "utf8");
}

function rendersSwitcher(code: string) {
  return code.includes("<LanguageSwitcher") || Object.keys(HEADERS).some((header) => code.includes(`<${header}`));
}

// The page itself or one of its layouts below the root layout must render the select.
function pageHasSwitcher(page: string): boolean {
  const code = source(page);
  if (rendersSwitcher(code)) return true;
  // A page that only calls notFound() shows the 404 screen instead.
  if (code.includes("notFound()")) return pageHasSwitcher(join(APP_DIR, "not-found.tsx"));
  for (let dir = dirname(page); dir.startsWith(APP_DIR) && dir !== APP_DIR; dir = dirname(dir)) {
    const layout = join(dir, "layout.tsx");
    try {
      if (rendersSwitcher(source(layout))) return true;
    } catch {
      // No layout in this folder.
    }
  }
  return false;
}

describe("language select options", () => {
  it("show a flag and the language's own name", () => {
    expect(LOCALES.map(localeOptionLabel)).toEqual(["🇹🇯 Тоҷикӣ", "🇷🇺 Русский", "🇬🇧 English"]);
    expect(LOCALES.map(localeShortLabel)).toEqual(["🇹🇯 TG", "🇷🇺 RU", "🇬🇧 EN"]);
    for (const locale of LOCALES) expect(LOCALE_NAMES[locale].flag).toMatch(/^\p{Regional_Indicator}{2}$/u);
  });
});

describe("localeFromCookies", () => {
  it("reads kassa_lang from a cookie string and falls back to Tajik", () => {
    expect(localeFromCookies("kassa_lang=ru")).toBe("ru");
    expect(localeFromCookies("theme=dark; kassa_lang=en; other=1")).toBe("en");
    expect(localeFromCookies("my_kassa_lang=en")).toBe("tg");
    expect(localeFromCookies("kassa_lang=de")).toBe("tg");
    expect(localeFromCookies("")).toBe("tg");
  });
});

describe("404 and error screen texts", () => {
  const CYRILLIC = /[Ѐ-ӿ]/;
  const TAJIK_LETTERS = /[ӣӯҳқғҷӢӮҲҚҒҶ]/;
  const leaves = (node: object): string[] =>
    Object.values(node).flatMap((value) => (typeof value === "string" ? [value] : leaves(value as object)));

  it("are filled in and really translated", () => {
    for (const locale of LOCALES) for (const text of leaves(dictionaries[locale].pages)) expect(text.trim()).not.toBe("");
    for (const text of leaves(dictionaries.en.pages)) expect(text).not.toMatch(CYRILLIC);
    for (const text of leaves(dictionaries.ru.pages)) expect(text).not.toMatch(TAJIK_LETTERS);
  });

  it("name the 404 in every language", () => {
    expect(LOCALES.map((locale) => createT(locale)("pages.notFound.title"))).toEqual(["Саҳифа ёфт нашуд", "Страница не найдена", "Page not found"]);
    expect(createT("ru")("pages.home")).toBe("На главную");
    expect(createT("en")("pages.error.title")).toBe("The page couldn't be opened");
  });
});

describe("language select placement", () => {
  it("every shared header renders it at its right end", () => {
    for (const [name, path] of Object.entries(HEADERS)) {
      const code = source(join(COMPONENTS_DIR, path));
      const direct = code.includes("<LanguageSwitcher");
      const throughHeader = name === "StatusPage" && code.includes("<SimpleHeader");
      expect(direct || throughHeader, path).toBe(true);
    }
  });

  it("comes last in every header row, so it sits in the top right corner", () => {
    for (const [name, path] of Object.entries(HEADERS)) {
      if (name === "StatusPage") continue;
      const code = source(join(COMPONENTS_DIR, path));
      const switcher = code.lastIndexOf("<LanguageSwitcher");
      const lastOther = Math.max(code.lastIndexOf("</Link>"), code.lastIndexOf("</button>"), code.lastIndexOf("<SampleDataBadge"), code.lastIndexOf("{t(adminUser.roleKey)}"));
      expect(switcher, path).toBeGreaterThan(lastOther);
    }
  });

  it("every page, 404 and error screen gets it from its own header or a layout", () => {
    const screens = [...files(APP_DIR, "page.tsx"), ...files(APP_DIR, "not-found.tsx"), ...files(APP_DIR, "error.tsx")];
    expect(screens.length).toBeGreaterThanOrEqual(13);
    const missing = screens.filter((page) => !pageHasSwitcher(page)).map((page) => relative(APP_DIR, page).split(sep).join("/"));
    expect(missing).toEqual([]);
  });

  it("the catch-all route sends unknown addresses to the 404", () => {
    expect(source(join(APP_DIR, "[...rest]", "page.tsx"))).toContain("notFound()");
  });

  it("is on the global error screen, which replaces the root layout", () => {
    const code = source(join(process.cwd(), "src", "app", "global-error.tsx"));
    expect(code).toContain("<StatusPage");
    expect(code).toContain("localeFromCookies");
  });

  it("is not duplicated inside a page", () => {
    for (const page of files(APP_DIR, "page.tsx")) {
      const code = source(page);
      const count = (code.match(/<LanguageSwitcher|<LandingHeader|<PricingHeader/g) ?? []).length;
      expect(count, relative(APP_DIR, page)).toBeLessThanOrEqual(1);
    }
  });
});
