"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { categories, type EntryCategory } from "@/data/transactions";
import { amountInWords } from "@/lib/amountInWords";
import { cn } from "@/lib/cn";
import { formatNumber, MINUS } from "@/lib/format";
import { isDraftValid } from "@/lib/ledgerDraft";
import type { EditorProps } from "@/components/transactions/EntryEditorPanel";

type EntrySheetProps = EditorProps & { onDelete: () => void };

export function EntrySheet({ draft, base, onChange, onSave, onClose, onDelete }: EntrySheetProps) {
  const expense = draft.kind === "expense";
  const value = Number(draft.amount || 0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="lg:hidden">
      <div className="fixed inset-0 z-30 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-sheet-title"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
        className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-[45] flex max-h-[calc(100dvh-9.5rem)] flex-col overflow-hidden rounded-t-[28px] bg-surface-container-lowest shadow-2xl"
      >
        <div className="flex w-full justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-outline-variant" />
        </div>
        <div className="flex items-center justify-between px-space-md py-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-tertiary" />
            <h2 id="entry-sheet-title" className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {draft.id ? `Таҳрири амалиёт #${draft.id}` : "Амалиёти нав"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Пӯшидан"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors active:bg-surface-container-high"
          >
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>

        <div className="flex flex-col gap-space-sm overflow-y-auto px-space-md py-space-xs pb-8 no-scrollbar">
          {base?.voiceNote && (
            <div className="flex items-start gap-2.5 rounded-xl bg-tertiary-fixed/40 p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed">
                <Icon name="graphic_eq" className="text-[16px]" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="font-label-caps text-label-caps font-bold tracking-wider text-tertiary uppercase">Аслияти сабти овозӣ</span>
                <p className="mt-0.5 font-body-sm text-body-sm text-on-surface italic">«{base.voiceNote.text}»</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-container p-1">
            <button
              type="button"
              aria-pressed={!expense}
              onClick={() => onChange({ kind: "income" })}
              className={cn(
                "rounded-lg py-2 text-center font-body-sm text-body-sm transition-colors",
                !expense ? "bg-surface-container-lowest font-bold text-primary shadow-sm" : "font-medium text-on-surface-variant",
              )}
            >
              + Даромад
            </button>
            <button
              type="button"
              aria-pressed={expense}
              onClick={() => onChange({ kind: "expense" })}
              className={cn(
                "rounded-lg py-2 text-center font-body-sm text-body-sm transition-colors",
                expense ? "bg-surface-container-lowest font-bold text-error shadow-sm" : "font-medium text-on-surface-variant",
              )}
            >
              {MINUS} Хароҷот
            </button>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-container-low py-2">
            <label htmlFor="sheet-amount" className="font-label-caps text-label-caps font-semibold text-outline uppercase">
              Маблағи амалиёт
            </label>
            <div className={cn("mt-1 flex items-baseline", expense ? "text-error" : "text-primary")}>
              <span className="font-headline-lg text-headline-lg font-extrabold">{expense ? MINUS : "+"}</span>
              <input
                id="sheet-amount"
                inputMode="numeric"
                value={draft.amount ? formatNumber(value) : ""}
                onChange={(event) => onChange({ amount: event.target.value.replace(/\D/g, "").slice(0, 7) })}
                placeholder="0"
                size={Math.max(formatNumber(value).length, 1)}
                className="bg-transparent text-center font-headline-lg text-headline-lg font-extrabold tracking-tight tnum focus:outline-none"
              />
              <span className="ml-1 font-headline-sm text-body-md font-semibold">смн</span>
            </div>
            <span className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{value > 0 ? amountInWords(value) : "Маблағро ворид кунед"}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-label-caps text-label-caps font-bold text-outline uppercase">Гурӯҳбандӣ</span>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(categories) as EntryCategory[]).map((key) => {
                const active = draft.category === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange({ category: key })}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-3 py-1.5 font-body-sm text-body-sm",
                      active
                        ? "bg-primary-fixed font-bold text-on-primary-fixed shadow-xs"
                        : "bg-surface-container font-medium text-on-surface-variant active:bg-surface-container-high",
                    )}
                  >
                    {active && <Icon name="check_circle" className="text-[16px]" />}
                    {categories[key].mobileLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sheet-note" className="font-label-caps text-label-caps font-bold text-outline uppercase">
              Эзоҳ ва тафсилот
            </label>
            <div className="relative">
              <input
                id="sheet-note"
                value={draft.title}
                onChange={(event) => onChange({ title: event.target.value })}
                placeholder="Масалан: Орд (2 халта)"
                className="w-full rounded-xl bg-surface-container-low py-2.5 pr-10 pl-3 font-body-md text-body-md text-on-surface focus:outline-none"
              />
              <Icon name="mic" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[20px] text-primary" />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              disabled={!isDraftValid(draft)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-tertiary-fixed-dim py-3 font-headline-sm text-body-md font-bold text-on-tertiary-fixed shadow-md transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              <Icon name="save" className="text-[20px]" />
              {draft.id ? "Сабти тағйирот" : "Илова кардан"}
            </button>
            {draft.id && (
              <button
                type="button"
                onClick={onDelete}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-surface-container py-2.5 font-body-md text-body-md font-semibold text-error transition-colors active:bg-error-container"
              >
                <Icon name="delete" className="text-[18px]" />
                Нобуд кардан
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
