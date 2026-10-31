import { describe, expect, it } from "vitest";
import { createT } from "@/lib/i18n/translate";
import { fitText, receiptImageData, receiptText, wrapText, type Measure } from "@/lib/receiptImage";
import { parseSabt, sabtProfit } from "@/lib/sabt";

const measure: Measure = (text) => Array.from(text).length * 10;

describe("receiptImageData", () => {
  it("shows the same rows, amounts and profit as the receipt on screen", () => {
    const entries = parseSabt("Фурӯш 500, такси 30");
    const data = receiptImageData(entries, sabtProfit(entries), createT("tg"), "tg", " Дӯкони Раҳим ", "31 октябр · 14:05");

    expect(data).toMatchObject({
      title: "ЧЕКИ НАВ",
      businessName: "Дӯкони Раҳим",
      when: "31 октябр · 14:05",
      rows: [
        { title: "Фурӯш", amount: "+500", tone: "income" },
        { title: "Такси", amount: "−30", tone: "expense" },
      ],
      debts: [],
      totalLabel: "ФОИДА",
      total: "+470",
      totalTone: "income",
      stamp: "ТАСДИҚ ШУД ✓",
    });
  });

  it("uses the chosen language and leaves out an empty business name", () => {
    const entries = parseSabt("такси 30");
    const data = receiptImageData(entries, sabtProfit(entries), createT("ru"), "ru", "  ", "31 октября · 14:05");

    expect(data.businessName).toBeNull();
    expect(data.totalLabel).toBe("УБЫТОК");
    expect(data.totalTone).toBe("expense");
  });

  it("keeps debts out of the rows and lists them in the note", () => {
    const entries = parseSabt("Фурӯш 500, Раҳим 120 насия гирифт");
    const data = receiptImageData(entries, sabtProfit(entries), createT("tg"), "tg", null, "");

    expect(data.rows).toHaveLength(1);
    expect(data.debts).toEqual([{ title: expect.any(String) as string, amount: "120" }]);
    expect(receiptText(data)).toContain("120");
  });
});

describe("fitText", () => {
  it("keeps text that fits", () => {
    expect(fitText("Фурӯш", 100, measure)).toBe("Фурӯш");
  });

  it("cuts long text with an ellipsis inside the width", () => {
    const cut = fitText("Ғалла, қанд, ҳезум ва ҷуворимакка", 100, measure);

    expect(cut.endsWith("…")).toBe(true);
    expect(measure(cut)).toBeLessThanOrEqual(100);
  });
});

describe("wrapText", () => {
  it("breaks a note into lines that fit", () => {
    const lines = wrapText("Насия ба чек дохил намешавад ва дар саҳифаи насия сабт мешавад", 120, measure);

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every((line) => measure(line) <= 120)).toBe(true);
    expect(lines.join(" ")).toContain("Насия");
  });
});
