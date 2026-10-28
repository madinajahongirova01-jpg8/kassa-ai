import { HandNote } from "@/components/daftar/HandNote";
import { CameraIcon, MicIcon, TextIcon } from "@/components/daftar/icons";
import { Marker } from "@/components/daftar/Marker";
import { daftarCategories, type DaftarEntry, type DaftarKind, type DaftarSource } from "@/data/daftar";
import { cn } from "@/lib/cn";
import { dayLabel, entryAmountText, type DaftarDay } from "@/lib/daftar";
import { daysUntil } from "@/lib/debts";
import { formatSomoni } from "@/lib/format";

const amountTone: Record<DaftarKind, string> = {
  income: "text-green",
  expense: "text-red",
  debtGiven: "text-pen",
  debtPaid: "text-green",
};

const pillTone: Record<DaftarKind, string> = {
  income: "border-ink text-ink",
  expense: "border-ink text-ink",
  debtGiven: "border-pen text-pen",
  debtPaid: "border-green text-green",
};

function SourceIcon({ source }: { source: DaftarSource }) {
  if (source === "voice") return <MicIcon className="text-pen" label="овоз" />;
  if (source === "photo") return <CameraIcon className="text-ink-3" label="акси чек" />;
  return <TextIcon className="text-ink-3" label="матн" />;
}

function LedgerRow({ entry }: { entry: DaftarEntry }) {
  const category = daftarCategories[entry.category];
  return (
    <li className="grid grid-cols-[38px_14px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-grid py-3 sm:grid-cols-[48px_14px_minmax(0,1fr)_110px_80px] sm:gap-x-4">
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

export function LedgerDays({ days }: { days: DaftarDay[] }) {
  if (days.length === 0) {
    return (
      <HandNote tone="muted" className="block py-10 text-center text-2xl">
        ҳеҷ сабт ёфт нашуд
      </HandNote>
    );
  }
  return (
    <>
      {days.map((day) => {
        const total = formatSomoni(day.total, { sign: true, unit: false });
        return (
          <section key={day.date} aria-label={dayLabel(day.date)}>
            <div className="flex items-baseline justify-between pt-3.5 pb-1 first:pt-2.5">
              <HandNote className="text-2xl">{dayLabel(day.date)}</HandNote>
              <span className="font-display text-sm font-bold">{daysUntil(day.date) === 0 ? <Marker className="px-1">{total}</Marker> : total}</span>
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
