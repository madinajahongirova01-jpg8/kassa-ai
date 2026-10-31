import { describe, expect, it, vi } from "vitest";
import type { DebtEvent } from "@/data/debts";
import type { PostResult } from "@/lib/api/client";
import { lastPayment, type DebtRow } from "@/lib/debts";
import { createT } from "@/lib/i18n/translate";
import { cancelPayment, debtChanges, debtDraftErrors, debtDraftOf, parseDebtEditAmount, saveDebtChanges } from "@/lib/nasiyaEdit";
import type { Post } from "@/lib/nasiyaForms";

const DEBT_ID = "00000000-0000-4000-8000-0000000000d1";
const PAYMENT_ID = "00000000-0000-4000-8000-0000000000p1";

function debt(overrides: Partial<DebtEvent> = {}): DebtEvent {
  return {
    id: DEBT_ID,
    customerId: "c",
    type: "debt",
    note: "Орд",
    amount: 10_000,
    date: "2026-10-20",
    time: "10:00",
    paid: 4_000,
    dueOn: "2026-11-01",
    ...overrides,
  };
}

function fakePost(result: PostResult<unknown>) {
  const calls: { url: string; body: unknown }[] = [];
  const post = vi.fn(async (url: string, body: unknown) => {
    calls.push({ url, body });
    return result;
  }) as unknown as Post;
  return { post, calls };
}

describe("debtDraftOf", () => {
  it("fills the row fields from the debt", () => {
    expect(debtDraftOf(debt({ amount: 12_050 }))).toEqual({ amount: "120.50", note: "Орд", dueOn: "2026-11-01" });
  });

  it("leaves the default note and a missing due date empty", () => {
    expect(debtDraftOf(debt({ note: "Насия", dueOn: null }))).toEqual({ amount: "100", note: "", dueOn: "" });
  });
});

describe("parseDebtEditAmount", () => {
  it("accepts somoni with dirams down to what was already paid", () => {
    expect(parseDebtEditAmount("150.50", 4_000)).toEqual({ dirams: 15_050 });
    expect(parseDebtEditAmount("40", 4_000)).toEqual({ dirams: 4_000 });
  });

  it("refuses less than what was already paid with a clear message", () => {
    expect(parseDebtEditAmount("39.99", 4_000)).toEqual({ error: "Маблағи қарз набояд аз пардохтшуда (40 смн) кам бошад." });
    expect(parseDebtEditAmount("10", 4_000, "ru")).toEqual({ error: "Сумма долга не может быть меньше уже оплаченной (40 смн)." });
  });

  it("refuses empty, zero, negative and non-numeric amounts", () => {
    expect(parseDebtEditAmount("", 0)).toEqual({ error: "Маблағро нависед." });
    expect(parseDebtEditAmount("0", 0)).toEqual({ error: "Маблағ бояд аз сифр зиёд бошад." });
    expect(parseDebtEditAmount("-5", 0)).toEqual({ error: "Маблағ бояд аз сифр зиёд бошад." });
    expect(parseDebtEditAmount("сад", 0, "en")).toEqual({ error: "Enter the amount in digits, for example 100 or 100.50." });
  });
});

describe("debtDraftErrors", () => {
  it("passes a valid row", () => {
    expect(debtDraftErrors({ amount: "120", note: "Шакар", dueOn: "2026-10-20" }, debt())).toEqual({});
  });

  it("refuses a due date before the debt date and an invalid date", () => {
    expect(debtDraftErrors({ amount: "100", note: "", dueOn: "2026-10-19" }, debt()).dueOn).toBe("Мӯҳлат набояд пеш аз санаи қарз бошад.");
    expect(debtDraftErrors({ amount: "100", note: "", dueOn: "2026-02-30" }, debt()).dueOn).toBe("Санаро дуруст интихоб кунед.");
  });
});

describe("debtChanges", () => {
  it("returns null when nothing changed", () => {
    expect(debtChanges(debtDraftOf(debt()), debt())).toBeNull();
    expect(debtChanges(debtDraftOf(debt({ note: "Насия", dueOn: null })), debt({ note: "Насия", dueOn: null }))).toBeNull();
  });

  it("sends only the changed fields in API format", () => {
    expect(debtChanges({ amount: "120.5", note: "Орд", dueOn: "2026-11-01" }, debt())).toEqual({ amount: "120.50" });
    expect(debtChanges({ amount: "100", note: " Шакар ", dueOn: "" }, debt())).toEqual({ description: "Шакар", dueOn: null });
    expect(debtChanges({ amount: "100", note: "", dueOn: "2026-11-01" }, debt())).toEqual({ description: "Насия" });
  });
});

describe("saveDebtChanges", () => {
  it("patches the debt through the Next proxy", async () => {
    const { post, calls } = fakePost({ ok: true, data: { id: DEBT_ID } });
    expect(await saveDebtChanges(DEBT_ID, { amount: "120.00" }, post)).toEqual({ ok: true, data: { id: DEBT_ID } });
    expect(calls).toEqual([{ url: `/api/debts/${DEBT_ID}`, body: { amount: "120.00" } }]);
  });

  it("explains an amount below what was paid and a missing debt", async () => {
    expect(await saveDebtChanges(DEBT_ID, { amount: "1.00" }, fakePost({ ok: false, status: 422, details: ["paidAmount: 40.50"] }).post)).toEqual({
      ok: false,
      error: "Маблағи қарз набояд аз пардохтшуда (40.50 смн) кам бошад.",
    });
    expect(await saveDebtChanges(DEBT_ID, { amount: "1.00" }, fakePost({ ok: false, status: 404, details: [] }).post)).toEqual({
      ok: false,
      error: "Сабт ёфт нашуд. Саҳифаро нав кунед.",
    });
  });
});

describe("cancelPayment", () => {
  it("posts to the payment cancel endpoint", async () => {
    const { post, calls } = fakePost({ ok: true, data: {} });
    expect((await cancelPayment(PAYMENT_ID, post)).ok).toBe(true);
    expect(calls).toEqual([{ url: `/api/payments/${PAYMENT_ID}/cancel`, body: {} }]);
  });

  it("explains a payment that is not found", async () => {
    expect(await cancelPayment(PAYMENT_ID, fakePost({ ok: false, status: 404, details: [] }).post)).toEqual({
      ok: false,
      error: "Сабт ёфт нашуд. Саҳифаро нав кунед.",
    });
  });
});

describe("cancelled payments in the history", () => {
  it("are not taken as the last payment", () => {
    const payment = (id: string, cancelled: boolean): DebtEvent => ({ id, customerId: "c", type: "payment", note: "", amount: -1_000, date: "2026-10-25", time: "10:00", cancelled });
    const row = { history: [payment("kept", false), payment("undone", true)] } as DebtRow;
    expect(lastPayment(row)?.id).toBe("kept");
  });

  it("are labelled in every language", () => {
    expect(createT("tg")("nasiya.edit.cancelled")).toBe("Бекор шуд");
    expect(createT("ru")("nasiya.edit.cancelled")).toBe("Отменена");
    expect(createT("en")("nasiya.edit.cancelled")).toBe("Cancelled");
    expect(createT("tg")("nasiya.edit.confirm")).toBe("Шумо боварӣ доред?");
    expect(createT("tg")("nasiya.edit.cancelPayment")).toBe("Пардохтро бекор кардан");
  });
});
