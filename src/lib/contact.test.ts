import { describe, expect, it } from "vitest";
import { normalizePhone, phoneProblemText, reminderText, smsHref, telHref } from "@/lib/contact";
import { customerPhoneError } from "@/lib/nasiyaForms";

describe("normalizePhone", () => {
  it("turns Tajik numbers into +992 and nine digits", () => {
    expect(normalizePhone("+992 90 123 45 67")).toEqual({ ok: true, phone: "+992901234567" });
    expect(normalizePhone("+992 (93) 555-78-90")).toEqual({ ok: true, phone: "+992935557890" });
    expect(normalizePhone("992901234567")).toEqual({ ok: true, phone: "+992901234567" });
    expect(normalizePhone("00992901234567")).toEqual({ ok: true, phone: "+992901234567" });
    expect(normalizePhone("90 123 45 67")).toEqual({ ok: true, phone: "+992901234567" });
  });

  it("keeps other international numbers", () => {
    expect(normalizePhone("+7 916 123-45-67")).toEqual({ ok: true, phone: "+79161234567" });
  });

  it("reports a missing number", () => {
    expect(normalizePhone("")).toEqual({ ok: false, reason: "missing" });
    expect(normalizePhone("   ")).toEqual({ ok: false, reason: "missing" });
    expect(normalizePhone(null)).toEqual({ ok: false, reason: "missing" });
  });

  it("rejects numbers that cannot be dialled", () => {
    expect(normalizePhone("+992 90 123 45")).toEqual({ ok: false, reason: "invalid" });
    expect(normalizePhone("+992 90 123 45 678")).toEqual({ ok: false, reason: "invalid" });
    expect(normalizePhone("12345")).toEqual({ ok: false, reason: "invalid" });
    expect(normalizePhone("+992 90 abc 45 67")).toEqual({ ok: false, reason: "invalid" });
    expect(normalizePhone("+12")).toEqual({ ok: false, reason: "invalid" });
  });
});

describe("phoneProblemText", () => {
  it("explains the problem in Tajik", () => {
    expect(phoneProblemText("missing")).toBe("Рақами телефони ин муштарӣ сабт нашудааст.");
    expect(phoneProblemText("invalid")).toContain("нодуруст");
  });
});

describe("contact links", () => {
  it("builds a tel link with the full number", () => {
    expect(telHref("+992901234567")).toBe("tel:+992901234567");
  });

  it("builds an sms link with the number and an encoded body", () => {
    const href = smsHref("+992901234567", "Салом! Қарзи шумо 120 сомонӣ аст.");
    expect(href.startsWith("sms:+992901234567?&body=")).toBe(true);
    expect(decodeURIComponent(href.slice("sms:+992901234567?&body=".length))).toBe("Салом! Қарзи шумо 120 сомонӣ аст.");
  });
});

describe("reminderText", () => {
  it("uses the first name, the business and the exact debt", () => {
    expect(reminderText({ name: " Алишер  Қосимов ", businessName: "Дӯкони Нур", balance: 12_050 })).toBe(
      "Салом, Алишер! Аз Дӯкони Нур. Қарзи шумо 120.50 сомонӣ аст. Агар имкон бошад, то охири ҳафта баргардонед. Ташаккур!",
    );
  });

  it("works without a business name", () => {
    expect(reminderText({ name: "Зафар", businessName: null, balance: 10_000 })).toBe(
      "Салом, Зафар! Қарзи шумо 100 сомонӣ аст. Агар имкон бошад, то охири ҳафта баргардонед. Ташаккур!",
    );
  });
});

describe("customerPhoneError", () => {
  it("rejects numbers that the call and SMS buttons could not use", () => {
    expect(customerPhoneError("12345")).not.toBeNull();
    expect(customerPhoneError("+992 90 123 45")).not.toBeNull();
    expect(customerPhoneError("90 123 45 67")).toBeNull();
  });
});
