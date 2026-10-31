import { describe, expect, it } from "vitest";
import type { PostResult } from "@/lib/api/client";
import { createT } from "@/lib/i18n/translate";
import { cashSabtEntries, parseSabt, sabtProfit, toCashEntriesPayload } from "@/lib/sabt";
import { receiptNoteKey } from "@/lib/sabtText";
import { MAX_PARSE_TEXT, parseOnServer, rulesResult, shouldAskServer, toParsedText } from "@/lib/sabtParse";

function fakePost(result: PostResult<unknown>) {
  const calls: { url: string; body: unknown }[] = [];
  const post = <T,>(url: string, body: unknown): Promise<PostResult<T>> => {
    calls.push({ url, body });
    return Promise.resolve(result as PostResult<T>);
  };
  return { post, calls };
}

const aiAnswer = {
  source: "ai",
  entries: [
    { kind: "expense", category: "TRANSPORT", title: "Такси", amountDirams: 3_050 },
    { kind: "income", category: "SALE", title: "Продажа", amountDirams: 50_000 },
    { kind: "debt", category: "OTHER", title: "Раҳим", amountDirams: 12_000 },
  ],
};

describe("parseOnServer", () => {
  it("asks the server and shows the AI lines with their place in the text", async () => {
    const text = "такси 30,50, продажа 500, Раҳим 120 насия";
    const { post, calls } = fakePost({ ok: true, data: aiAnswer });

    const result = await parseOnServer(text, post);

    expect(calls).toEqual([{ url: "/api/entries/parse", body: { text } }]);
    expect(result.source).toBe("ai");
    expect(result.entries.map(({ kind, amount }) => ({ kind, amount }))).toEqual([
      { kind: "expense", amount: 30.5 },
      { kind: "income", amount: 500 },
      { kind: "debt", amount: 120 },
    ]);
    expect(text.slice(result.entries[0].start, result.entries[0].end)).toBe("30,50");
    expect(text.slice(result.entries[2].start, result.entries[2].end)).toBe("120");
  });

  it("never saves an AI debt as an expense and keeps dirams exact", async () => {
    const { post } = fakePost({ ok: true, data: aiAnswer });
    const { entries } = await parseOnServer("такси 30,50, продажа 500, Раҳим 120 насия", post);

    expect(cashSabtEntries(entries).map((entry) => entry.kind)).toEqual(["expense", "income"]);
    expect(sabtProfit(entries)).toBe(469.5);
    expect(toCashEntriesPayload(entries, "TEXT")).toEqual({
      entries: [
        { kind: "EXPENSE", category: "TRANSPORT", amount: "30.50", title: "Такси", source: "TEXT" },
        { kind: "INCOME", category: "SALE", amount: "500.00", title: "Продажа", source: "TEXT" },
      ],
    });
  });

  it.each([
    ["a network error", { ok: false, status: 0, details: [] }],
    ["too many requests", { ok: false, status: 429, details: [] }],
    ["an expired session", { ok: false, status: 401, details: [] }],
    ["a server error", { ok: false, status: 500, details: [] }],
    ["an unexpected answer", { ok: true, data: { source: "ai", entries: [{ kind: "gift", amountDirams: 1 }] } }],
    ["a missing answer", { ok: true, data: null }],
  ] satisfies [string, PostResult<unknown>][])("uses the local rules on %s", async (_case, answer) => {
    const { post } = fakePost(answer);
    const text = "продажа 500, такси 30";

    expect(await parseOnServer(text, post)).toEqual({ source: "rules", entries: parseSabt(text) });
  });

  it("keeps the server rules result marked as rules", async () => {
    const { post } = fakePost({ ok: true, data: { source: "rules", entries: [{ kind: "income", category: "SALE", title: "Продажа", amountDirams: 50_000 }] } });

    expect((await parseOnServer("продажа 500", post)).source).toBe("rules");
  });

  it("does not call the server for empty, number-free or too long text", async () => {
    const { post, calls } = fakePost({ ok: true, data: aiAnswer });

    await parseOnServer("   ", post);
    await parseOnServer("салом", post);
    await parseOnServer(`продажа 500 ${"а".repeat(MAX_PARSE_TEXT)}`, post);

    expect(calls).toHaveLength(0);
    expect(shouldAskServer("продажа 500")).toBe(true);
  });
});

describe("toParsedText", () => {
  it("does not mark a place for an amount it cannot find", () => {
    const result = toParsedText("фурӯш", { source: "ai", entries: [{ kind: "income", category: "SALE", title: "Фурӯш", amountDirams: 100 }] });
    expect(result.entries[0]).toMatchObject({ start: 0, end: 0, amount: 1 });
  });

  it("marks repeated amounts in order", () => {
    const text = "такси 30, нон 30";
    const result = toParsedText(text, {
      source: "ai",
      entries: [
        { kind: "expense", category: "TRANSPORT", title: "Такси", amountDirams: 3_000 },
        { kind: "expense", category: "OTHER", title: "Нон", amountDirams: 3_000 },
      ],
    });
    expect(result.entries.map((entry) => entry.start)).toEqual([6, 14]);
  });
});

describe("rulesResult", () => {
  it("is the same as the local rules", () => {
    const text = "Имрӯз 2 халта орд гирифтам 600, такси 30, ба коргар 150 додам. Фурӯш 1800 шуд.";
    expect(rulesResult(text)).toEqual({ source: "rules", entries: parseSabt(text) });
  });
});

describe("receiptNoteKey", () => {
  it("names utilities that only AI can return", () => {
    expect(receiptNoteKey({ category: "UTILITIES" })).toBe("sabt.notes.UTILITIES");
    expect(receiptNoteKey({ category: "RENT" })).toBe("sabt.notes.RENT");
    expect((["tg", "ru", "en"] as const).map((locale) => createT(locale)("sabt.notes.UTILITIES"))).toEqual(["барқ, об, газ", "коммунальные", "utilities"]);
  });
});

describe("parse label", () => {
  it("names AI only for the AI result, in every language", () => {
    for (const locale of ["tg", "ru", "en"] as const) {
      const t = createT(locale);
      expect(t("sabt.parsedBy.ai")).toContain("AI");
      expect(t("sabt.parsedBy.rules")).not.toContain("AI");
    }
    expect(createT("tg")("sabt.parsedBy.ai")).toBe("AI фаҳмид");
    expect(createT("tg")("sabt.parsedBy.rules")).toBe("Бо қоидаҳо ҳисоб шуд");
  });
});
