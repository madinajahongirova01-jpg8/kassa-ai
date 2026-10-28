import { Icon } from "@/components/ui/Icon";
import { categories, inputMethods, paymentMethods, type EntryCategory, type LedgerEntry, type PaymentMethod } from "@/data/transactions";
import { cn } from "@/lib/cn";
import { formatLedgerDate } from "@/lib/ledger";
import { isDraftValid, type EntryDraft } from "@/lib/ledgerDraft";

type EditorProps = {
  draft: EntryDraft;
  base: LedgerEntry | undefined;
  onChange: (patch: Partial<EntryDraft>) => void;
  onSave: () => void;
  onClose: () => void;
};

const fieldLabel = "mb-1.5 block font-label-caps text-label-caps text-on-surface-variant uppercase";

export function EntryEditorPanel({ draft, base, onChange, onSave, onClose }: EditorProps) {
  const expense = draft.kind === "expense";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
      className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-xl"
    >
      <div className="flex items-center justify-between bg-surface-container-low p-space-md">
        <div className="flex items-center gap-space-xs">
          <Icon name="receipt_long" className="text-primary" />
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            {draft.id ? "Илова / Таҳрири амалиёт" : "Амалиёти нав"}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Пӯшидан"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-outline-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <Icon name="close" className="text-xl" />
        </button>
      </div>

      <div className="max-h-[calc(100vh-180px)] space-y-space-md overflow-y-auto p-space-md no-scrollbar">
        <div>
          <span className={fieldLabel}>Навъи муомилот</span>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-container p-1">
            <button
              type="button"
              aria-pressed={expense}
              onClick={() => onChange({ kind: "expense" })}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg py-2.5 font-body-sm text-body-sm transition-all",
                expense ? "bg-surface-container-lowest font-bold text-error shadow-sm" : "font-medium text-on-surface-variant hover:text-error",
              )}
            >
              <Icon name="arrow_circle_up" className="text-base" />
              Хароҷот (&minus;)
            </button>
            <button
              type="button"
              aria-pressed={!expense}
              onClick={() => onChange({ kind: "income" })}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg py-2.5 font-body-sm text-body-sm transition-all",
                !expense ? "bg-surface-container-lowest font-bold text-primary shadow-sm" : "font-medium text-on-surface-variant hover:text-primary",
              )}
            >
              <Icon name="arrow_circle_down" className="text-base" />
              Даромад (+)
            </button>
          </div>
        </div>

        <div className="space-y-1 rounded-xl bg-surface-container-low p-space-md">
          <div className="flex items-center justify-between">
            <label htmlFor="entry-amount" className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              Маблағи пардохт
            </label>
            <span className="rounded-sm bg-primary-fixed/30 px-2 py-0.5 font-label-caps text-label-caps text-primary">Сомонӣ (TJS)</span>
          </div>
          <div className="relative flex items-baseline">
            <span className={cn("mr-1 font-headline-lg text-headline-lg font-extrabold", expense ? "text-error" : "text-primary")}>
              {expense ? "−" : "+"}
            </span>
            <input
              id="entry-amount"
              inputMode="numeric"
              value={draft.amount}
              onChange={(event) => onChange({ amount: event.target.value.replace(/\D/g, "").slice(0, 7) })}
              placeholder="0"
              className="w-full bg-transparent font-display-hero-mobile text-display-hero-mobile font-extrabold text-on-surface tnum focus:outline-none"
            />
            <span className="font-headline-md text-headline-md font-bold text-outline">смн</span>
          </div>
        </div>

        {base?.voiceNote && (
          <div className="space-y-2 rounded-xl bg-primary-container/10 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary">
                  <Icon name="mic" className="text-xs" />
                </span>
                <span className="font-body-sm text-body-sm font-bold text-primary">Сабти овозӣ</span>
              </div>
              <span className="font-tabular-ledger text-body-sm font-semibold text-primary">{base.voiceNote.duration}</span>
            </div>
            <p className="rounded-sm bg-surface-container-lowest/80 p-2 font-body-sm text-body-sm text-on-surface italic">
              «{base.voiceNote.text}»
            </p>
          </div>
        )}

        <div>
          <span className={cn(fieldLabel, "mb-2")}>{expense ? "Категорияи хароҷот" : "Категорияи даромад"}</span>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(categories) as EntryCategory[]).map((key) => {
              const category = categories[key];
              const active = draft.category === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ category: key })}
                  className={cn(
                    "flex items-center gap-2 rounded-lg p-2.5 text-left font-body-sm text-body-sm transition-colors",
                    active
                      ? "bg-surface-container-highest font-semibold text-on-surface shadow-xs"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container",
                  )}
                >
                  <Icon name={category.formIcon} className={cn("text-lg", category.formIconClassName)} />
                  {category.formLabel}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="entry-title" className={cn(fieldLabel, "mb-1")}>
            Тавсифи амалиёт
          </label>
          <input
            id="entry-title"
            value={draft.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="Масалан: Орд (2 халта)"
            className="w-full rounded-lg bg-surface-container-low px-3 py-2.5 font-body-sm text-body-sm text-on-surface shadow-inner focus:bg-surface-container-lowest focus:outline-none"
          />
        </div>

        <div>
          <span className={fieldLabel}>Тарзи воридоти сабт</span>
          <div className="flex items-center gap-2">
            {inputMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                aria-pressed={draft.source === method.id}
                onClick={() => onChange({ source: method.id })}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 font-body-sm text-body-sm",
                  draft.source === method.id
                    ? "bg-primary-fixed/40 font-semibold text-on-primary-fixed"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container",
                )}
              >
                <Icon name={method.icon} className="text-base" />
                {method.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-space-sm">
          <div>
            <label htmlFor="entry-payment" className={cn(fieldLabel, "mb-1")}>
              Шакли пардохт
            </label>
            <div className="relative">
              <select
                id="entry-payment"
                value={draft.payment}
                onChange={(event) => onChange({ payment: event.target.value as PaymentMethod })}
                className="w-full appearance-none rounded-lg bg-surface-container-low px-3 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none"
              >
                {(Object.keys(paymentMethods) as PaymentMethod[]).map((key) => (
                  <option key={key} value={key}>
                    {paymentMethods[key]}
                  </option>
                ))}
              </select>
              <Icon name="expand_more" className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-base text-outline" />
            </div>
          </div>
          <div>
            <label htmlFor="entry-time" className={cn(fieldLabel, "mb-1")}>
              Сана ва вақт
            </label>
            <div className="flex items-center gap-1 rounded-lg bg-surface-container-low px-3 py-2 font-body-sm text-body-sm text-on-surface">
              <span className="whitespace-nowrap">{formatLedgerDate(draft.date, false)},</span>
              <input
                id="entry-time"
                type="time"
                value={draft.time}
                onChange={(event) => onChange({ time: event.target.value })}
                className="w-full min-w-0 bg-transparent focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="relative py-2">
          <div className="w-full border-t border-dashed border-outline-variant" />
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 bg-surface-container-lowest px-2 font-label-caps text-label-caps text-outline uppercase">
            {base?.aiConfidence ? "Худтасдиқи AI фаъол" : "Сабти дастӣ"}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1 font-label-caps text-label-caps text-outline">
          <span>СИСТЕМА: KASSA-AI-CORE-v2</span>
          <span>ИДЕНТИФИКАТОР: {draft.id ? `#TRX-${draft.id}` : "Нав"}</span>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-space-sm bg-surface-container-low p-space-md">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg bg-surface-container-high py-2.5 font-body-sm text-body-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-highest"
        >
          Бекор кардан
        </button>
        <button
          type="submit"
          disabled={!isDraftValid(draft)}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2.5 font-body-sm text-body-sm font-bold text-on-primary shadow-md transition-all hover:bg-primary-container disabled:opacity-50"
        >
          <Icon name="save" className="text-base" />
          Сабт кардан
        </button>
      </div>
    </form>
  );
}

export type { EditorProps };
