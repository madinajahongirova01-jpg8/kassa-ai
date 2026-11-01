import { buildDebtList } from "../services/debts";

describe("buildDebtList", () => {
  const now = new Date("2026-10-30T00:00:00Z");

  it("marks debts older than 30 days as overdue", () => {
    const list = buildDebtList(
      [
        { customerName: "Ҷамшед", balanceDiram: 10000, oldestCreditAt: new Date("2026-09-01T00:00:00Z") },
        { customerName: "Алишер", balanceDiram: 5000, oldestCreditAt: new Date("2026-10-20T00:00:00Z") },
      ],
      now,
    );
    expect(list[0].isOverdue).toBe(true);
    expect(list[1].isOverdue).toBe(false);
  });
});