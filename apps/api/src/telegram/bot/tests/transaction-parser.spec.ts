import { parseTransactionText } from "../services/transaction-parser";
import { formatDiram, somoniTextToDiram } from "../services/money";

describe("money", () => {
  it("converts somoni text to integer dirams", () => {
    expect(somoniTextToDiram("50")).toBe(5000);
    expect(somoniTextToDiram("120.50")).toBe(12050);
    expect(somoniTextToDiram("10,5")).toBe(1050);
    expect(somoniTextToDiram("abc")).toBeNull();
  });

  it("formats dirams", () => {
    expect(formatDiram(5000)).toBe("50 сомонӣ");
    expect(formatDiram(12050)).toBe("120.50 сомонӣ");
  });
});

describe("parseTransactionText", () => {
  it("understands a Tajik sale", () => {
    const r = parseTransactionText("50 сомонӣ нон фурӯхтам");
    expect(r?.type).toBe("sale");
    expect(r?.amountDiram).toBe(5000);
  });

  it("understands a Russian sale", () => {
    const r = parseTransactionText("Продал хлеб за 50 сомони");
    expect(r?.type).toBe("sale");
    expect(r?.amountDiram).toBe(5000);
  });

  it("understands a Tajik expense with decimals", () => {
    const r = parseTransactionText("харидам 120.50 сомонӣ орд");
    expect(r?.type).toBe("expense");
    expect(r?.amountDiram).toBe(12050);
  });

  it("understands a Russian expense", () => {
    const r = parseTransactionText("Купил муку 200");
    expect(r?.type).toBe("expense");
    expect(r?.amountDiram).toBe(20000);
  });

  it("treats nasia as credit_sale, not expense", () => {
    const r = parseTransactionText("Ба Ҷамшед насия 100 сомонӣ нон додам");
    expect(r?.type).toBe("credit_sale");
    expect(r?.amountDiram).toBe(10000);
    expect(r?.customerName).toBe("Ҷамшед");
  });

  it("understands Russian credit sale", () => {
    const r = parseTransactionText("Продал Алишеру в долг на 300");
    expect(r?.type).toBe("credit_sale");
    expect(r?.amountDiram).toBe(30000);
    expect(r?.customerName).toBe("Алишеру");
  });

  it("understands a debt payment", () => {
    const r = parseTransactionText("Ҷамшед қарзашро баргардонд 100 сомонӣ");
    expect(r?.type).toBe("debt_payment");
    expect(r?.amountDiram).toBe(10000);
  });

  it("reads dirams", () => {
    const r = parseTransactionText("50 дирам харидам");
    expect(r?.type).toBe("expense");
    expect(r?.amountDiram).toBe(50);
  });

  it("reads thousands with a space", () => {
    const r = parseTransactionText("1 000 сомонӣ фурӯхтам");
    expect(r?.amountDiram).toBe(100000);
  });

  it("prefers the number with a currency word", () => {
    const r = parseTransactionText("нон фурӯхтам 2 дона 50 сомонӣ");
    expect(r?.amountDiram).toBe(5000);
  });

  it("returns null when it is not understood or ambiguous", () => {
    expect(parseTransactionText("салом")).toBeNull();
    expect(parseTransactionText("нон 10 ва мева 20 фурӯхтам")).toBeNull();
    expect(parseTransactionText("харидор 50 сомонӣ")).toBeNull();
    expect(parseTransactionText("")).toBeNull();
  });
});