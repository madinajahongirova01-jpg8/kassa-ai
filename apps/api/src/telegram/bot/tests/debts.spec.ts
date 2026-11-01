import { buildDebtList } from "../services/debts";
import { addDays } from "../services/day-range";
import type { DebtBalance } from "../types/transaction";

describe("buildDebtList", () => {
  const balance = (dueOn: string | null, balanceDiram = 10000): DebtBalance => ({ customerName: "Ҷамшед", balanceDiram, dueOn });

  it("marks a customer overdue only after the due date, like the Kassa website", () => {
    const now = new Date("2026-10-30T07:00:00Z"); // 12:00 on 30 October in Dushanbe
    const list = buildDebtList([balance("2026-10-29"), balance("2026-10-30"), balance("2026-10-31"), balance(null)], now);
    expect(list.map((d) => d.isOverdue)).toEqual([true, false, false, false]);
  });

  it("uses the Dushanbe calendar day, not the UTC one", () => {
    const debt = [balance("2026-11-01")];
    // 18:59 UTC is 23:59 on 1 November in Dushanbe: due today, not overdue.
    expect(buildDebtList(debt, new Date("2026-11-01T18:59:00Z"))[0].isOverdue).toBe(false);
    // 19:00 UTC is already 2 November in Dushanbe, while it is still 1 November in UTC.
    expect(buildDebtList(debt, new Date("2026-11-01T19:00:00Z"))[0].isOverdue).toBe(true);
  });

  it("never marks a customer with nothing left to pay as overdue", () => {
    expect(buildDebtList([balance("2026-01-01", 0)], new Date("2026-10-30T07:00:00Z"))[0].isOverdue).toBe(false);
  });
});

describe("addDays", () => {
  it("adds calendar days across month and year ends and leap days", () => {
    expect(addDays("2026-11-02", 30)).toBe("2026-12-02");
    expect(addDays("2026-12-15", 30)).toBe("2027-01-14");
    expect(addDays("2028-02-01", 30)).toBe("2028-03-02");
  });
});
