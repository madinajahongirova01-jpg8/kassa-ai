// A small four-function calculator that evaluates step by step, like a pocket calculator:
// "1000 − 100 =" gives 900. It only shows a result; it never changes any debt by itself.

export type CalcOperator = "+" | "-" | "*" | "/";

export type CalcState = {
  display: string;
  stored: number | null;
  operator: CalcOperator | null;
  /** The next digit starts a new number instead of extending the shown one. */
  fresh: boolean;
  error: boolean;
};

export type CalcAction =
  | { type: "digit"; digit: string }
  | { type: "operator"; operator: CalcOperator }
  | { type: "equals" }
  | { type: "clear" };

export const CALC_MAX_DIGITS = 12;
const MAX_RESULT = 1e15;

export const initialCalc: CalcState = { display: "0", stored: null, operator: null, fresh: true, error: false };

const ERROR: CalcState = { ...initialCalc, display: "Хато", error: true };

// Rounds away floating-point noise (0.1 + 0.2) and never shows an exponent.
export function formatCalcNumber(value: number): string {
  const text = value.toFixed(10).replace(/\.?0+$/, "");
  return text === "-0" ? "0" : text;
}

function compute(left: number, operator: CalcOperator, right: number): number | null {
  if (operator === "/" && right === 0) return null;
  const result = operator === "+" ? left + right : operator === "-" ? left - right : operator === "*" ? left * right : left / right;
  return Number.isFinite(result) && Math.abs(result) < MAX_RESULT ? result : null;
}

export function calcReducer(state: CalcState, action: CalcAction): CalcState {
  switch (action.type) {
    case "clear":
      return initialCalc;

    case "digit": {
      if (!/^[0-9]$/.test(action.digit)) return state;
      if (state.error) return { ...initialCalc, display: action.digit, fresh: false };
      if (state.fresh || state.display === "0") return { ...state, display: action.digit, fresh: false };
      if (state.display.replace(/\D/g, "").length >= CALC_MAX_DIGITS) return state;
      return { ...state, display: state.display + action.digit };
    }

    case "operator": {
      if (state.error) return state;
      // Pressing another operator right after one only changes the operator.
      if (state.fresh && state.operator !== null) return { ...state, operator: action.operator };
      const current = Number(state.display);
      if (state.stored === null || state.operator === null) {
        return { ...state, stored: current, operator: action.operator, fresh: true };
      }
      const result = compute(state.stored, state.operator, current);
      if (result === null) return ERROR;
      return { display: formatCalcNumber(result), stored: result, operator: action.operator, fresh: true, error: false };
    }

    case "equals": {
      if (state.error || state.stored === null || state.operator === null) return state;
      const result = compute(state.stored, state.operator, Number(state.display));
      if (result === null) return ERROR;
      return { ...initialCalc, display: formatCalcNumber(result) };
    }
  }
}

const SYMBOLS: Record<CalcOperator, string> = { "+": "+", "-": "−", "*": "×", "/": "÷" };

export function operatorSymbol(operator: CalcOperator): string {
  return SYMBOLS[operator];
}

/** The pending part of the calculation, e.g. "1000 −", shown above the number. */
export function pendingText(state: CalcState): string {
  if (state.error || state.stored === null || state.operator === null) return "";
  return `${formatCalcNumber(state.stored)} ${operatorSymbol(state.operator)}`;
}
