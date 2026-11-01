import { parseTransactionText } from "../services/transaction-parser";

describe("flexible parsing", () => {
  it("accepts a typo in the verb", () => {
    const r = parseTransactionText("шоколадро 100 сомонӣ хаидам");
    expect(r?.type).toBe("expense");
    expect(r?.amountDiram).toBe(10000);
  });

  it("accepts a short currency spelling", () => {
    const r = parseTransactionText("шоколадро 100 сомӣ харидам");
    expect(r?.type).toBe("expense");
    expect(r?.amountDiram).toBe(10000);
  });

  it("understands an English sale", () => {
    const r = parseTransactionText("Sold bread for 50 somoni");
    expect(r?.type).toBe("sale");
    expect(r?.amountDiram).toBe(5000);
  });

  it("understands an English expense", () => {
    const r = parseTransactionText("Bought flour 120.50 somoni");
    expect(r?.type).toBe("expense");
    expect(r?.amountDiram).toBe(12050);
  });

  it("understands an English credit sale", () => {
    const r = parseTransactionText("Sold bread to Ali on credit 100 somoni");
    expect(r?.type).toBe("credit_sale");
    expect(r?.customerName).toBe("Ali");
  });
});