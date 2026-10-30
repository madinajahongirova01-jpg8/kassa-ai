import { describe, expect, it } from "vitest";
import type { DebtEvent } from "@/data/debts";
import { requestErrorText } from "@/lib/api/client";
import { phoneProblemText, reminderAmount, reminderText } from "@/lib/contact";
import { dayMonth, historyNote } from "@/lib/debts";
import { LOCALES } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { createPlural, createT } from "@/lib/i18n/translate";
import {
  createCustomer,
  createDebt,
  customerErrorText,
  DEFAULT_DEBT_NOTE,
  debtErrorText,
  parseDebtAmount,
  validateCustomer,
  validateDebt,
  type Post,
} from "@/lib/nasiyaForms";

const CYRILLIC = /[Ѐ-ӿ]/;
const TAJIK_LETTERS = /[ӣӯҳқғҷӢӮҲҚҒҶ]/;
const NBSP = " ";
const CUSTOMER_ID = "00000000-0000-4000-8000-0000000000c1";
const TODAY = "2026-10-30";

function leaves(node: object): string[] {
  return Object.values(node).flatMap((value) => (typeof value === "string" ? [value] : leaves(value as object)));
}

function event(overrides: Partial<DebtEvent>): DebtEvent {
  return { id: "e", customerId: CUSTOMER_ID, type: "debt", note: "Орд, 1 халта", amount: 10_000, date: "2026-10-20", time: "10:00", ...overrides };
}

const failingPost = (status: number): Post => async () => ({ ok: false, status, details: [] });

describe("Debts screen texts", () => {
  it("are filled in and really translated", () => {
    for (const locale of LOCALES) {
      for (const text of [...leaves(dictionaries[locale].nasiya), dictionaries[locale].common.close]) expect(text.trim()).not.toBe("");
    }
    for (const text of leaves(dictionaries.en.nasiya)) expect(text).not.toMatch(CYRILLIC);
    for (const text of leaves(dictionaries.ru.nasiya)) expect(text).not.toMatch(TAJIK_LETTERS);
  });

  it("keep the original Tajik texts", () => {
    const t = createT("tg");
    expect(t("nasiya.headline.lead")).toBe("Ба шумо…");
    expect(t("nasiya.filters.near")).toBe("Мӯҳлат наздик");
    expect(t("nasiya.sheet.acceptPayment")).toBe("Пардохт қабул шуд");
    expect(t("nasiya.forms.notePlaceholder")).toBe("масалан: орд, 1 халта");
    expect(t("nasiya.calc.title")).toBe("Ҳисобкунак");
    expect(t("common.close")).toBe("Пӯшидан");
  });

  it("translate filters, buttons and the form", () => {
    expect(["all", "near", "overdue", "paid"].map((id) => createT("ru")(`nasiya.filters.${id}` as never))).toEqual(["Все", "Срок близко", "Просрочено", "Оплачено"]);
    expect(["all", "near", "overdue", "paid"].map((id) => createT("en")(`nasiya.filters.${id}` as never))).toEqual(["All", "Due soon", "Overdue", "Paid"]);
    expect(createT("ru")("nasiya.headline.newDebt")).toBe("+ Новый долг");
    expect(createT("en")("nasiya.forms.recordDebt")).toBe("Record debt");
    expect(createT("ru")("nasiya.sticker.stamp")).toBe("ОПЛАЧЕНО");
    expect(createT("en")("nasiya.calc.error")).toBe("Error");
  });

  it("use the right word forms for late customers and days", () => {
    expect(createPlural("tg")("nasiya.headline.late", 2)).toBe("2 нафар дер кард!");
    expect(createPlural("ru")("nasiya.headline.late", 1)).toBe("1 человек просрочил!");
    expect(createPlural("ru")("nasiya.headline.late", 3)).toBe("3 человека просрочили!");
    expect(createPlural("en")("nasiya.headline.late", 1)).toBe("1 person is late!");
    expect(createPlural("ru")("nasiya.sheet.daysLeft", 5, { date: "4 ноября" })).toBe("срок до 4 ноября — осталось 5 дней");
    expect(createPlural("en")("nasiya.sheet.overdue", 1, { date: "October 29" })).toBe("was due October 29 — 1 day overdue");
    expect(createPlural("tg")("nasiya.sheet.overdue", 4, { date: "26 октябр" })).toBe("мӯҳлат 26 октябр буд — 4 рӯз гузашт");
  });
});

describe("dates in the history", () => {
  it("say today in the chosen language and format other days", () => {
    expect(dayMonth(TODAY, TODAY)).toBe("имрӯз");
    expect(dayMonth(TODAY, TODAY, "ru")).toBe("сегодня");
    expect(dayMonth("2026-10-20", TODAY, "ru")).toBe("20 октября");
    expect(dayMonth("2026-10-20", TODAY, "en")).toBe("October 20");
  });
});

describe("history labels", () => {
  it("translate system labels and keep the owner's notes", () => {
    expect(historyNote(event({}), "en")).toBe("Орд, 1 халта");
    expect(historyNote(event({ type: "payment", note: "Каме баргардонд" }), "ru")).toBe("Каме баргардонд");
    expect(historyNote(event({ type: "payment", note: "" }))).toBe("Пардохт");
    expect(historyNote(event({ type: "payment", note: "" }), "ru")).toBe("Платёж");
    expect(historyNote(event({ type: "payment", note: "  " }), "en")).toBe("Payment");
    expect(historyNote(event({ note: DEFAULT_DEBT_NOTE }))).toBe("Насия");
    expect(historyNote(event({ note: DEFAULT_DEBT_NOTE }), "ru")).toBe("Долг");
    expect(historyNote(event({ note: DEFAULT_DEBT_NOTE }), "en")).toBe("Debt");
  });
});

describe("form validation", () => {
  it("returns Tajik messages by default and translated ones on request", () => {
    expect(validateCustomer({ name: " ", phone: "" })).toEqual({ name: "Номи муштариро нависед." });
    expect(validateCustomer({ name: " ", phone: "abc" }, "ru")).toEqual({
      name: "Введите имя клиента.",
      phone: "Введите номер правильно, например +992 90 123 45 67.",
    });
    expect(validateDebt({ customerId: "", amount: "", note: "", dueOn: "2026-10-01" }, [CUSTOMER_ID], TODAY, "en")).toEqual({
      customerId: "Choose a customer.",
      amount: "Enter the amount.",
      dueOn: "The due date can't be before today.",
    });
  });

  it("checks amounts the same way in every language", () => {
    for (const locale of LOCALES) {
      expect(parseDebtAmount("1 200", locale)).toEqual({ dirams: 120_000 });
      expect("error" in parseDebtAmount("2.5", locale)).toBe(true);
    }
    expect(parseDebtAmount("2.5", "ru")).toEqual({ error: "Введите сумму в целых сомони, без дирамов." });
    expect(parseDebtAmount("сад", "en")).toEqual({ error: "Enter the amount in digits." });
    expect(parseDebtAmount("10000001", "en")).toEqual({ error: "The amount must not exceed 10,000,000 somoni." });
    expect(parseDebtAmount("10000001", "ru")).toEqual({ error: `Сумма не должна превышать 10${NBSP}000${NBSP}000 сомони.` });
  });
});

describe("server errors", () => {
  it("translate form errors by status", () => {
    expect(customerErrorText(400, "ru")).toBe("Проверьте данные клиента: имя обязательно, телефон — цифрами.");
    expect(customerErrorText(404, "en")).toBe("This customer wasn't found. Reload the page.");
    expect(debtErrorText(401, "en")).toBe("Your session has expired. Please sign in again.");
    expect(debtErrorText(500)).toBe("Сервер ҳоло ҷавоб намедиҳад. Сабт нигоҳ дошта нашуд, боз кӯшиш кунед.");
  });

  it("come back from create and update in the chosen language", async () => {
    expect(await createCustomer({ name: "Зафар", phone: "" }, failingPost(429), "ru")).toEqual({
      ok: false,
      error: "Слишком много попыток. Подождите немного и попробуйте снова.",
    });
    expect(await createDebt({ customerId: CUSTOMER_ID, amount: "100", note: "", dueOn: "" }, [CUSTOMER_ID], TODAY, failingPost(400), "en")).toEqual({
      ok: false,
      error: "Check the debt details: amount, note and date.",
    });
  });

  it("explain a refused payment", () => {
    expect(requestErrorText(422, ["remainingAmount: 70.00"])).toBe("Пардохт аз қарз зиёд аст — боқимонда 70.00 смн.");
    expect(requestErrorText(422, ["remainingAmount: 70.00"], "ru")).toBe("Платёж больше долга — остаток 70.00 смн.");
    expect(requestErrorText(422, [], "en")).toBe("This payment can't be accepted.");
    expect(requestErrorText(503, [], "en")).toBe("The server isn't responding. Try again a little later.");
  });
});

describe("phone problems and reminders", () => {
  it("translate phone problems", () => {
    expect(phoneProblemText("missing", "ru")).toBe("Номер телефона этого клиента не записан.");
    expect(phoneProblemText("invalid", "en")).toContain("+992 90 123 45 67");
  });

  it("write the reminder in the chosen language with the name and shop unchanged", () => {
    expect(reminderAmount(12_050, "ru")).toBe("120,50 сомони");
    expect(reminderText({ name: " Алишер  Қосимов ", businessName: "Дӯкони Нур", balance: 12_050, locale: "ru" })).toBe(
      "Здравствуйте, Алишер! Это Дӯкони Нур. Ваш долг — 120,50 сомони. Если есть возможность, верните до конца недели. Спасибо!",
    );
    expect(reminderText({ name: "Зафар", businessName: null, balance: 10_000, locale: "en" })).toBe(
      "Hello, Зафар! Your debt is 100 somoni. If you can, please pay it back by the end of the week. Thank you!",
    );
  });
});
