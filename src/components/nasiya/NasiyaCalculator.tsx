"use client";

import { useReducer, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { calcReducer, initialCalc, operatorSymbol, pendingText, type CalcAction, type CalcOperator, type CalcState } from "@/lib/calculator";
import { cn } from "@/lib/cn";

const OPERATOR_LABELS: Record<CalcOperator, string> = { "+": "ҷамъ", "-": "тарҳ", "*": "зарб", "/": "тақсим" };

type Key = { text: string; label?: string; action: CalcAction; tone: "digit" | "operator" | "clear" | "equals" };

const digit = (value: string): Key => ({ text: value, action: { type: "digit", digit: value }, tone: "digit" });
const operator = (value: CalcOperator): Key => ({
  text: operatorSymbol(value),
  label: OPERATOR_LABELS[value],
  action: { type: "operator", operator: value },
  tone: "operator",
});

const KEYS: Key[] = [
  digit("7"), digit("8"), digit("9"), operator("/"),
  digit("4"), digit("5"), digit("6"), operator("*"),
  digit("1"), digit("2"), digit("3"), operator("-"),
  { text: "C", label: "Тоза кардан", action: { type: "clear" }, tone: "clear" },
  digit("0"),
  { text: "=", label: "Натиҷа", action: { type: "equals" }, tone: "equals" },
  operator("+"),
];

const keyTones = {
  digit: "bg-card text-ink hover:text-pen",
  operator: "bg-card text-pen",
  clear: "bg-card text-red",
  equals: "bg-pen text-card shadow-hard-sm active:translate-x-px active:translate-y-px active:shadow-none",
};

// Only shows a result: the owner types it into the amount field themselves.
export function NasiyaCalculator() {
  const [open, setOpen] = useState(false);
  const [state, dispatch] = useReducer(calcReducer, initialCalc);

  return (
    <div className="flex flex-col gap-3 print:hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="nasiya-calculator"
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-tile border-[1.5px] border-ink bg-card px-5 font-display text-base font-bold text-ink shadow-hard hover:text-pen active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm aria-expanded:translate-x-0.5 aria-expanded:translate-y-0.5 aria-expanded:bg-pen-mist aria-expanded:shadow-hard-sm sm:w-auto sm:self-start lg:h-14 lg:text-lg"
      >
        <Icon name="calculate" className="text-[26px] lg:text-[30px]" />
        Ҳисобкунак
      </button>
      {open && <CalculatorPanel state={state} dispatch={dispatch} onClose={() => setOpen(false)} />}
    </div>
  );
}

// The state lives in NasiyaCalculator, so closing and reopening keeps the last number.
function CalculatorPanel({ state, dispatch, onClose }: { state: CalcState; dispatch: (action: CalcAction) => void; onClose: () => void }) {
  const pending = pendingText(state);

  return (
    <section
      id="nasiya-calculator"
      aria-label="Ҳисобкунак"
      className="flex w-full flex-col gap-3 rounded-sheet border-[1.5px] border-ink bg-card px-[18px] py-4 shadow-hard sm:max-w-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-[19px] font-bold">Ҳисобкунак</h2>
        <button type="button" onClick={onClose} className="text-sm font-semibold text-ink-2 hover:text-pen">
          ✕ Пӯшидан
        </button>
      </div>
      <output
        aria-live="polite"
        className="flex flex-col items-end rounded-xl border-[1.5px] border-ink bg-pen-mist px-3.5 py-2 font-mono select-all"
      >
        <span className="h-5 text-[13px] text-ink-2">{pending}</span>
        <span className={cn("max-w-full truncate font-display text-[30px] leading-tight font-extrabold", state.error && "text-red")}>
          {state.display}
        </span>
      </output>
      <div className="grid grid-cols-4 gap-2">
        {KEYS.map((key) => (
          <button
            key={key.text}
            type="button"
            aria-label={key.label}
            onClick={() => dispatch(key.action)}
            className={cn("h-12 rounded-xl border-[1.5px] border-ink font-display text-lg font-bold", keyTones[key.tone])}
          >
            {key.text}
          </button>
        ))}
      </div>
    </section>
  );
}
