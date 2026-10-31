import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/i18n/config";
import { createT } from "@/lib/i18n/translate";
import { ONBOARDING_DISMISSED_KEY, onboardingSteps, readDismissed, showOnboarding, writeDismissed, type KeyValueStorage } from "@/lib/onboarding";
import { rulesResult } from "@/lib/sabtParse";

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

const brokenStorage: KeyValueStorage = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
};

describe("onboardingSteps", () => {
  it("leads to the new entry, debts and reports pages", () => {
    expect(onboardingSteps({ hasEntry: false, hasCustomer: false }).map((step) => [step.id, step.href])).toEqual([
      ["entry", "/app/new"],
      ["debt", "/app/debts"],
      ["reports", "/app/reports"],
    ]);
  });

  it("ticks the first step once there is an entry and the second once there is a customer", () => {
    const done = (hasEntry: boolean, hasCustomer: boolean) => onboardingSteps({ hasEntry, hasCustomer }).map((step) => step.done);
    expect(done(false, false)).toEqual([false, false, false]);
    expect(done(true, false)).toEqual([true, false, false]);
    expect(done(false, true)).toEqual([false, true, false]);
    expect(done(true, true)).toEqual([true, true, false]);
  });
});

describe("showOnboarding", () => {
  it("shows the card to a new user", () => {
    expect(showOnboarding({ hasEntry: false, hasCustomer: false }, false)).toBe(true);
  });

  it("keeps the card while only one of the first two steps is done", () => {
    expect(showOnboarding({ hasEntry: true, hasCustomer: false }, false)).toBe(true);
    expect(showOnboarding({ hasEntry: false, hasCustomer: true }, false)).toBe(true);
  });

  it("hides the card once the first two steps are done", () => {
    expect(showOnboarding({ hasEntry: true, hasCustomer: true }, false)).toBe(false);
  });

  it("hides the card after the owner closed it", () => {
    expect(showOnboarding({ hasEntry: false, hasCustomer: false }, true)).toBe(false);
  });
});

describe("closing the card", () => {
  it("is remembered in storage", () => {
    const storage = memoryStorage();
    expect(readDismissed(storage)).toBe(false);
    expect(writeDismissed(storage)).toBe(true);
    expect(storage.data.get(ONBOARDING_DISMISSED_KEY)).toBe("1");
    expect(readDismissed(storage)).toBe(true);
  });

  it("does not break when storage is missing or blocked", () => {
    expect(readDismissed(null)).toBe(false);
    expect(writeDismissed(null)).toBe(false);
    expect(readDismissed(brokenStorage)).toBe(false);
    expect(writeDismissed(brokenStorage)).toBe(false);
  });
});

describe("new entry examples", () => {
  it("are understood by the rules in every language", () => {
    for (const locale of LOCALES) {
      const t = createT(locale);
      for (const key of ["sale", "flour", "wage"] as const) {
        expect(rulesResult(t(`sabt.examples.${key}`)).entries.length).toBeGreaterThan(0);
      }
    }
  });

  it("keep the Tajik texts", () => {
    const t = createT("tg");
    expect([t("sabt.examples.sale"), t("sabt.examples.flour"), t("sabt.examples.wage")]).toEqual(["Фурӯш 500, такси 30", "2 халта орд 600", "Музди коргар 150"]);
    expect(t("sabt.examples.hint")).toBe("Як ҷумла нависед — мо чек месозем.");
    expect(t("today.start.title")).toBe("Аз чӣ сар кунем?");
  });
});
