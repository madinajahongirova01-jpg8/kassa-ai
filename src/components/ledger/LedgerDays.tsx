import { HandNote } from "@/components/daftar/HandNote";
import { CameraIcon, MicIcon, TextIcon } from "@/components/daftar/icons";
import { Marker } from "@/components/daftar/Marker";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { dayLabel, entryAmountText, ledgerCategories, type LedgerDay, type LedgerEntry, type LedgerKind, type LedgerSource } from "@/lib/ledger";

const amountTone: Record<LedgerKind, string> = {
  income: "text-green",
  expense: "text-red",
  debtGiven: "text-pen",
  debtPaid: "text-green",
};

const pillTone: Record<LedgerKind, string> = {
  income: "border-ink text-ink",
  expense: "border-ink text-ink",
  debtGiven: "border-pen text-pen",
  debtPaid: "border-green text-green",
};

function SourceIcon({ source }: { source: LedgerSource | null }) {
  if (source === "voice") return <MicIcon className="text-pen" label="овоз" />;
  if (source === "photo") return <CameraIcon className="text-ink-3" label="акси чек" />;
  if (source === "text") return <TextIcon className="text-ink-3" label="матн" />;
  return <span aria-hidden />;
}

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const category = ledgerCategories[entry.category];
  return (
    <li className="grid grid-cols-[38px_14px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-grid py-3 sm:grid-cols-[48px_14px_minmax(0,1fr)_110px_96px] sm:gap-x-4">
      <span className="text-xs text-ink-3">{entry.time}</span>
      <SourceIcon source={entry.source} />
      <span className="min-w-0">
        <span className="block truncate">{entry.title}</span>
        <span className="block font-sans text-[11px] text-ink-3 sm:hidden">{category}</span>
      </span>
      <span className="hidden sm:block">
        <span className={cn("inline-block rounded-full border-[1.5px] px-2 py-px font-sans text-xs font-semibold", pillTone[entry.kind])}>{category}</span>
      </span>
      <span className={cn("text-right font-bold", amountTone[entry.kind])}>{entryAmountText(entry)}</span>
    </li>
  );
}

export function LedgerDays({ days, today, emptyText }: { days: LedgerDay[]; today: string; emptyText: string }) {
  if (days.length === 0) {
    return (
      <HandNote tone="muted" role="status" className="block py-10 text-center text-2xl">
        {emptyText}
      </HandNote>
    );
  }
  return (
    <>
      {days.map((day) => {
        const total = formatMoney(day.total, { sign: true, unit: false });
        return (
          <section key={day.date} aria-label={dayLabel(day.date, today)}>
            <div className="flex items-baseline justify-between pt-3.5 pb-1 first:pt-2.5">
              <HandNote className="text-2xl">{dayLabel(day.date, today)}</HandNote>
              <span className="font-display text-sm font-bold" title="Фоидаи рӯз: даромад − хароҷот">
                {day.date === today ? <Marker className="px-1">{total}</Marker> : total}
              </span>
            </div>
            <ul className="font-mono text-sm">
              {day.entries.map((entry) => (
                <LedgerRow key={entry.id} entry={entry} />
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
