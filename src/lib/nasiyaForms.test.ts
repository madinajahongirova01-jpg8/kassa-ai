import { describe, expect, it, vi } from "vitest";
import type { PostResult } from "@/lib/api/client";
import {
  createCustomer,
  createDebt,
  customerNameError,
  customerPhoneError,
  dueDateError,
  parseDebtAmount,
  somoniToDirams,
  toDebtPayload,
  type DebtForm,
  type Post,
} from "@/lib/nasiyaForms";

const TODAY = "2026-10-30";
const CUSTOMER_ID = "00000000-0000-4000-8000-000000000001";

function fakePost(result: PostResult<unknown>) {
  const calls: { url: string; body: unknown }[] = [];
  const post = vi.fn(async (url: string, body: unknown) => {
    calls.push({ url, body });
    return result;
  }) as unknown as Post;
  return { post, calls };
}

function debtForm(overrides: Partial<DebtForm> = {}): DebtForm {
  return { customerId: CUSTOMER_ID, amount: "100", note: "", dueOn: "", ...overrides };
}

describe("customerNameError", () => {
  it("requires a name", () => {
    expect(customerNameError("")).toBe("Номи муштариро нависед.");
    expect(customerNameError("   ")).toBe("Номи муштариро нависед.");
  });

  it("accepts a name up to 100 characters", () => {
    expect(customerNameError("Алишер Қосимов")).toBeNull();
    expect(customerNameError("а".repeat(100))).toBeNull();
    expect(customerNameError("а".repeat(101))).toBe("Ном бояд то 100 ҳарф бошад.");
  });
});

describe("customerPhoneError", () => {
  it("allows an empty phone and a valid one", () => {
    expect(customerPhoneError("")).toBeNull();
    expect(customerPhoneError("+992 90 123 45 67")).toBeNull();
  });

  it("rejects letters and too short numbers", () => {
    expect(customerPhoneError("телефон")).not.toBeNull();
    expect(customerPhoneError("12")).not.toBeNull();
  });
});

describe("somoniToDirams", () => {
  it("converts whole somoni to integer dirams", () => {
    expect(somoniToDirams(100)).toBe(10_000);
    expect(somoniToDirams(1)).toBe(100);
  });

  it("refuses zero, negative and fractional somoni", () => {
    expect(() => somoniToDirams(0)).toThrow(RangeError);
    expect(() => somoniToDirams(-5)).toThrow(RangeError);
    expect(() => somoniToDirams(1.5)).toThrow(RangeError);
  });
});

describe("parseDebtAmount", () => {
  it("parses whole somoni into dirams", () => {
    expect(parseDebtAmount("100")).toEqual({ dirams: 10_000 });
    expect(parseDebtAmount(" 1 200 ")).toEqual({ dirams: 120_000 });
  });

  it("rejects empty, zero, negative and fractional amounts", () => {
    expect(parseDebtAmount("")).toEqual({ error: "Маблағро нависед." });
    expect(parseDebtAmount("0")).toEqual({ error: "Маблағ бояд аз сифр зиёд бошад." });
    expect(parseDebtAmount("-50")).toEqual({ error: "Маблағ бояд аз сифр зиёд бошад." });
    expect(parseDebtAmount("10.5")).toEqual({ error: "Маблағро бо сомонии бутун нависед, бе дирам." });
    expect(parseDebtAmount("10,50")).toEqual({ error: "Маблағро бо сомонии бутун нависед, бе дирам." });
    expect(parseDebtAmount("сад")).toEqual({ error: "Маблағро бо рақам нависед." });
  });

  it("rejects amounts above the API limit", () => {
    expect(parseDebtAmount("10000000")).toEqual({ dirams: 1_000_000_000 });
    expect("error" in parseDebtAmount("10000001")).toBe(true);
  });
});

describe("dueDateError", () => {
  it("allows no date, today and later", () => {
    expect(dueDateError("", TODAY)).toBeNull();
    expect(dueDateError(TODAY, TODAY)).toBeNull();
    expect(dueDateError("2026-11-15", TODAY)).toBeNull();
  });

  it("rejects past and invalid dates", () => {
    expect(dueDateError("2026-10-29", TODAY)).toBe("Санаи баргардонидан набояд пеш аз имрӯз бошад.");
    expect(dueDateError("2026-02-30", TODAY)).toBe("Санаро дуруст интихоб кунед.");
  });
});

describe("toDebtPayload", () => {
  it("sends the amount in the API format, today as the date and a default note", () => {
    expect(toDebtPayload(debtForm(), 10_000, TODAY)).toEqual({ amount: "100.00", description: "Насия", occurredOn: TODAY });
  });

  it("passes the note and due date when given", () => {
    expect(toDebtPayload(debtForm({ note: " Орд ", dueOn: "2026-11-05" }), 25_000, TODAY)).toEqual({
      amount: "250.00",
      description: "Орд",
      occurredOn: TODAY,
      dueOn: "2026-11-05",
    });
  });
});

describe("createCustomer", () => {
  it("posts the trimmed name and phone through the Next proxy", async () => {
    const { post, calls } = fakePost({ ok: true, data: { id: CUSTOMER_ID } });
    const result = await createCustomer({ name: "  Зафар ", phone: " +992 93 555 7890 " }, post);

    expect(result).toEqual({ ok: true, data: { id: CUSTOMER_ID } });
    expect(calls).toEqual([{ url: "/api/customers", body: { name: "Зафар", phone: "+992 93 555 7890" } }]);
  });

  it("does not send an empty phone or any owner id", async () => {
    const { post, calls } = fakePost({ ok: true, data: { id: CUSTOMER_ID } });
    await createCustomer({ name: "Зафар", phone: "" }, post);
    expect(calls[0].body).toEqual({ name: "Зафар" });
  });

  it("does not call the API when the name is missing", async () => {
    const { post, calls } = fakePost({ ok: true, data: {} });
    expect(await createCustomer({ name: " ", phone: "" }, post)).toEqual({ ok: false, error: "Номи муштариро нависед." });
    expect(calls).toHaveLength(0);
  });

  it("turns API errors into Tajik messages", async () => {
    expect(await createCustomer({ name: "Зафар", phone: "" }, fakePost({ ok: false, status: 400, details: [] }).post)).toEqual({
      ok: false,
      error: "Маълумоти муштариро санҷед: ном ҳатмист, телефон — бо рақамҳо.",
    });
    expect(await createCustomer({ name: "Зафар", phone: "" }, fakePost({ ok: false, status: 401, details: [] }).post)).toEqual({
      ok: false,
      error: "Вақти даромадан гузашт. Аз нав дароед.",
    });
    expect(await createCustomer({ name: "Зафар", phone: "" }, fakePost({ ok: false, status: 0, details: [] }).post)).toEqual({
      ok: false,
      error: "Сервер ҳоло ҷавоб намедиҳад. Сабт нигоҳ дошта нашуд, боз кӯшиш кунед.",
    });
  });
});

describe("createDebt", () => {
  it("posts the debt for the chosen customer in exact API amounts", async () => {
    const { post, calls } = fakePost({ ok: true, data: { id: "debt" } });
    const result = await createDebt(debtForm({ amount: "100", note: "Шакар", dueOn: "2026-11-10" }), [CUSTOMER_ID], TODAY, post);

    expect(result).toEqual({ ok: true, data: { id: "debt" } });
    expect(calls).toEqual([
      {
        url: `/api/customers/${CUSTOMER_ID}/debts`,
        body: { amount: "100.00", description: "Шакар", occurredOn: TODAY, dueOn: "2026-11-10" },
      },
    ]);
  });

  it("does not call the API for an unknown customer or a bad amount", async () => {
    const { post, calls } = fakePost({ ok: true, data: {} });
    expect(await createDebt(debtForm({ customerId: "" }), [CUSTOMER_ID], TODAY, post)).toEqual({ ok: false, error: "Муштариро интихоб кунед." });
    expect(await createDebt(debtForm({ amount: "0" }), [CUSTOMER_ID], TODAY, post)).toEqual({ ok: false, error: "Маблағ бояд аз сифр зиёд бошад." });
    expect(await createDebt(debtForm({ amount: "2.5" }), [CUSTOMER_ID], TODAY, post)).toEqual({
      ok: false,
      error: "Маблағро бо сомонии бутун нависед, бе дирам.",
    });
    expect(calls).toHaveLength(0);
  });

  it("turns API errors into Tajik messages", async () => {
    expect(await createDebt(debtForm(), [CUSTOMER_ID], TODAY, fakePost({ ok: false, status: 404, details: [] }).post)).toEqual({
      ok: false,
      error: "Ин муштарӣ ёфт нашуд. Саҳифаро нав кунед.",
    });
    expect(await createDebt(debtForm(), [CUSTOMER_ID], TODAY, fakePost({ ok: false, status: 400, details: [] }).post)).toEqual({
      ok: false,
      error: "Маълумоти қарзро санҷед: маблағ, шарҳ ва сана.",
    });
    expect(await createDebt(debtForm(), [CUSTOMER_ID], TODAY, fakePost({ ok: false, status: 429, details: [] }).post)).toEqual({
      ok: false,
      error: "Кӯшишҳо зиёд шуданд. Каме сабр кунед ва боз кӯшиш кунед.",
    });
  });
});
