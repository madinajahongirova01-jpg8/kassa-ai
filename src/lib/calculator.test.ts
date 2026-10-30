import { describe, expect, it } from "vitest";
import { calcReducer, formatCalcNumber, initialCalc, pendingText, type CalcAction, type CalcState } from "@/lib/calculator";

// Presses keys as written: digits, + - * /, "=" and "C".
function press(keys: string, state: CalcState = initialCalc): CalcState {
  return [...keys.replace(/\s/g, "")].reduce<CalcState>((current, key) => {
    let action: CalcAction;
    if (key === "=") action = { type: "equals" };
    else if (key === "C") action = { type: "clear" };
    else if (key === "+" || key === "-" || key === "*" || key === "/") action = { type: "operator", operator: key };
    else action = { type: "digit", digit: key };
    return calcReducer(current, action);
  }, state);
}

describe("calcReducer", () => {
  it("starts at zero", () => {
    expect(initialCalc.display).toBe("0");
  });

  it("does the four operations", () => {
    expect(press("1000-100=").display).toBe("900");
    expect(press("250+750=").display).toBe("1000");
    expect(press("12*3=").display).toBe("36");
    expect(press("900/4=").display).toBe("225");
  });

  it("evaluates step by step like a pocket calculator", () => {
    expect(press("2+3*4=").display).toBe("20");
    const midway = press("1000-100-");
    expect(midway.display).toBe("900");
    expect(pendingText(midway)).toBe("900 −");
    expect(press("50=", midway).display).toBe("850");
  });

  it("replaces the operator when two are pressed in a row", () => {
    expect(press("10+-4=").display).toBe("6");
  });

  it("shows decimals from division without floating-point noise", () => {
    expect(press("10/4=").display).toBe("2.5");
    expect(press("1/3=").display).toBe("0.3333333333");
    expect(formatCalcNumber(0.1 + 0.2)).toBe("0.3");
  });

  it("shows negative results", () => {
    expect(press("100-250=").display).toBe("-150");
  });

  it("does not keep leading zeros", () => {
    expect(press("007").display).toBe("7");
  });

  it("starts a new number after a result", () => {
    expect(press("2+2=5").display).toBe("5");
    expect(press("2+2=*3=").display).toBe("12");
  });

  it("refuses division by zero and recovers on the next digit", () => {
    const failed = press("5/0=");
    expect(failed.error).toBe(true);
    expect(failed.display).toBe("Хато");
    expect(press("+", failed)).toEqual(failed);
    expect(press("7", failed)).toEqual({ ...initialCalc, display: "7", fresh: false });
  });

  it("limits the number of digits", () => {
    expect(press("1234567890123").display).toBe("123456789012");
  });

  it("refuses results that are too large to show", () => {
    expect(press("999999999999*999999999999=").error).toBe(true);
  });

  it("clears everything with C", () => {
    expect(press("12+3C")).toEqual(initialCalc);
  });

  it("ignores = without an operation and anything that is not a digit", () => {
    expect(press("42=").display).toBe("42");
    expect(calcReducer(initialCalc, { type: "digit", digit: "x" })).toEqual(initialCalc);
  });
});
