import { getTodayRange } from "../services/day-range";

describe("getTodayRange", () => {
  it("starts a new day at midnight Dushanbe time", () => {
    const r = getTodayRange(new Date("2026-10-30T20:00:00Z"));
    expect(r.from.toISOString()).toBe("2026-10-30T19:00:00.000Z");
    expect(r.to.toISOString()).toBe("2026-10-31T19:00:00.000Z");
  });

  it("keeps 23:59 Dushanbe time in the old day", () => {
    const r = getTodayRange(new Date("2026-10-30T18:59:00Z"));
    expect(r.from.toISOString()).toBe("2026-10-29T19:00:00.000Z");
    expect(r.to.toISOString()).toBe("2026-10-30T19:00:00.000Z");
  });
});