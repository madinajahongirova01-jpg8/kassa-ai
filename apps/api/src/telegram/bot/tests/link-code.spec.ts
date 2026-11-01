import {
  formatCode,
  generateCode,
  hashCode,
  isValidCodeFormat,
  normalizeCode,
} from "../services/link-code";
import { getDushanbeDate, getDushanbeHour } from "../services/day-range";

describe("link code", () => {
  it("generates a valid 8-character code", () => {
    const code = generateCode();
    expect(code).toHaveLength(8);
    expect(isValidCodeFormat(code)).toBe(true);
  });

  it("normalizes user input", () => {
    expect(normalizeCode(" abcd-2345 ")).toBe("ABCD2345");
    expect(formatCode("ABCD2345")).toBe("ABCD-2345");
  });

  it("rejects bad codes", () => {
    expect(isValidCodeFormat("ABC")).toBe(false);
    expect(isValidCodeFormat("ABCD0O1I")).toBe(false);
  });

  it("hashes without revealing the code", () => {
    const hash = hashCode("ABCD2345");
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain("ABCD2345");
    expect(hashCode("ABCD2345")).toBe(hash);
  });
});

describe("Dushanbe time", () => {
  it("gives local date and hour", () => {
    const now = new Date("2026-10-30T20:30:00Z");
    expect(getDushanbeDate(now)).toBe("2026-10-31");
    expect(getDushanbeHour(now)).toBe(1);
  });
});