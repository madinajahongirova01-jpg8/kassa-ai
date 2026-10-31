import { describe, expect, it } from "vitest";
import { sabtDemo, sabtModes } from "@/data/sabt";
import { formatNumber } from "@/lib/format";
import { LOCALES } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { createPlural, createT, type MessageKey } from "@/lib/i18n/translate";
import { MAX_SABT_AMOUNT, parseSabt } from "@/lib/sabt";
import { sabtNoteKey, saveErrorKey } from "@/lib/sabtText";
import { speechErrorKey } from "@/lib/useSpeechRecognition";

const CYRILLIC = /[Ѐ-ӿ]/;
const TAJIK_LETTERS = /[ӣӯҳқғҷӢӮҲҚҒҶ]/;

function leaves(node: object): string[] {
  return Object.values(node).flatMap((value) => (typeof value === "string" ? [value] : leaves(value as object)));
}

describe("Sabt screen texts", () => {
  it("are filled in for every language", () => {
    for (const locale of LOCALES) {
      for (const text of leaves(dictionaries[locale].sabt)) expect(text.trim()).not.toBe("");
    }
  });

  it("are really translated", () => {
    for (const text of leaves(dictionaries.en.sabt)) expect(text).not.toMatch(CYRILLIC);
    for (const text of leaves(dictionaries.ru.sabt)) expect(text).not.toMatch(TAJIK_LETTERS);
  });

  it("keep the original Tajik texts", () => {
    const t = createT("tg");
    expect(t("sabt.receipt.title")).toBe("ЧЕКИ НАВ");
    expect(t("sabt.actions.confirm")).toBe("Тасдиқ ✓");
    expect(t("sabt.actions.savedNew")).toBe("Сабт шуд ✓ · Сабти нав +");
    expect(t("sabt.status.demo")).toBe("Ин матни намунавӣ аст — барои сабт маълумоти худро нависед.");
    expect(t("sabt.legend.debt")).toBe("● кабуд — насия, ба чек намеравад");
  });

  it("translate mode buttons, the receipt and actions", () => {
    const ru = createT("ru");
    const en = createT("en");
    expect(sabtModes.map((mode) => ru(mode.labelKey))).toEqual(["Текст", "Голос", "Фото чека"]);
    expect(sabtModes.map((mode) => en(mode.labelKey))).toEqual(["Text", "Voice", "Receipt photo"]);
    expect(ru("sabt.receipt.title")).toBe("НОВЫЙ ЧЕК");
    expect(en("sabt.receipt.stamp")).toBe("CONFIRMED ✓");
    expect(ru("sabt.actions.saving")).toBe("Сохраняем…");
    expect(en("sabt.actions.edit")).toBe("Edit");
  });

  it("build the debt hint sentence around the Debts link", () => {
    const sentence = (locale: (typeof LOCALES)[number]) => {
      const t = createT(locale);
      return `${t("sabt.receipt.debtBefore")}${t("nav.debts")}${t("sabt.receipt.debtAfter")}`;
    };
    expect(sentence("tg")).toBe("Насия ба чек дохил намешавад. Насияро дар саҳифаи Насия сабт кунед.");
    expect(sentence("ru")).toBe("Долг не входит в чек. Записывайте долги на странице Долги.");
    expect(sentence("en")).toBe("Debts aren't included in the receipt. Record them on the Debts page.");
  });

  it("fill the amount limit in each language's number format", () => {
    const max = (locale: (typeof LOCALES)[number]) => formatNumber(MAX_SABT_AMOUNT, 0, locale);
    expect(createT("tg")("sabt.errors.amount", { max: max("tg") })).toBe("Маблағ бояд аз 1 то 10 000 000 сомонӣ бошад.");
    expect(createT("ru")("sabt.errors.amount", { max: max("ru") })).toBe("Сумма должна быть от 1 до 10 000 000 сомони.");
    expect(createT("en")("sabt.errors.amount", { max: max("en") })).toBe("The amount must be between 1 and 10,000,000 somoni.");
  });

  it("count found entries, characters and seconds with the right word form", () => {
    const ru = createPlural("ru");
    const en = createPlural("en");
    expect(createPlural("tg")("sabt.said.found", 4)).toBe("4 сабт ёфтам!");
    expect(ru("sabt.said.found", 1)).toBe("Нашёл 1 запись!");
    expect(ru("sabt.said.found", 4)).toBe("Нашёл 4 записи!");
    expect(ru("sabt.said.found", 5)).toBe("Нашёл 5 записей!");
    expect(en("sabt.said.found", 1)).toBe("Found 1 entry!");
    expect(en("sabt.said.found", 3)).toBe("Found 3 entries!");
    expect(ru("sabt.steps.characters", 81)).toBe("81 символ");
    expect(ru("sabt.steps.seconds", 12)).toBe("12 секунд");
    expect(en("sabt.steps.seconds", 1)).toBe("1 second");
    expect(ru("sabt.steps.entries", 3)).toBe("3 записи");
    expect(en("sabt.steps.entries", 0)).toBe("0 entries");
  });
});

describe("save errors", () => {
  it("pick a text by HTTP status", () => {
    expect([400, 401, 403, 429, 500, 0].map(saveErrorKey)).toEqual([
      "sabt.errors.invalid",
      "sabt.errors.session",
      "sabt.errors.forbidden",
      "sabt.errors.tooMany",
      "sabt.errors.server",
      "sabt.errors.server",
    ]);
  });

  it("are the original Tajik messages", () => {
    const t = createT("tg");
    expect(t(saveErrorKey(401))).toBe("Сессия тамом шуд. Дубора дароед ва боз сабт кунед.");
    expect(t(saveErrorKey(503))).toBe("Сервер ҳоло ҷавоб намедиҳад. Сабт нигоҳ дошта нашуд, боз кӯшиш кунед.");
    expect(createT("en")(saveErrorKey(429))).toBe("Too many attempts. Wait a moment and try again.");
  });
});

describe("voice input errors", () => {
  it("map every browser error code, with a fallback", () => {
    const codes = ["not-allowed", "service-not-allowed", "audio-capture", "network", "language-not-supported", "language-unavailable", "no-speech"];
    for (const code of codes) expect(speechErrorKey(code)).not.toBe("sabt.speech.failed");
    expect(speechErrorKey("language-unavailable")).toBe(speechErrorKey("language-not-supported"));
    expect(speechErrorKey("failed")).toBe("sabt.speech.failed");
    expect(speechErrorKey("something-new")).toBe("sabt.speech.failed");
  });

  it("show the original Tajik texts and translations", () => {
    expect(createT("tg")(speechErrorKey("no-speech"))).toBe("Овоз шунида нашуд. Наздиктар ба микрофон боз гап занед.");
    expect(createT("ru")(speechErrorKey("not-allowed"))).toBe("Доступ к микрофону не разрешён. Разрешите микрофон в настройках браузера.");
    expect(createT("en")(speechErrorKey("audio-capture"))).toBe("No microphone found. Connect one and try again.");
  });
});

describe("receipt notes", () => {
  it("show the parser's Tajik note unchanged in Tajik", () => {
    const t = createT("tg");
    for (const entry of parseSabt(sabtDemo.transcript)) {
      const key = sabtNoteKey(entry);
      expect(key).toBeDefined();
      expect(t(key as MessageKey)).toBe(entry.note);
    }
  });

  it("translate the notes and fall back for categories the parser never gives", () => {
    const entries = parseSabt(sabtDemo.transcript);
    expect(entries.map((entry) => createT("ru")(sabtNoteKey(entry) as MessageKey))).toEqual(["товар для магазина", "проезд", "зарплата", "доход"]);
    expect(entries.map((entry) => createT("en")(sabtNoteKey(entry) as MessageKey))).toEqual(["goods for the shop", "transport", "wages", "income"]);
    expect(sabtNoteKey({ category: "RENT" })).toBe("sabt.notes.RENT");
    expect([createT("tg")("sabt.notes.RENT"), createT("ru")("sabt.notes.RENT"), createT("en")("sabt.notes.RENT")]).toEqual(["иҷора", "аренда", "rent"]);
    expect(sabtNoteKey({ category: "UTILITIES" })).toBeUndefined();
  });
});
