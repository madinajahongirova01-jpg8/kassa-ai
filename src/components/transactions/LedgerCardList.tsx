import { Icon } from "@/components/ui/Icon";
import { categories, sources, type LedgerEntry } from "@/data/transactions";
import { cn } from "@/lib/cn";
import { formatSomoni } from "@/lib/format";
import { formatLedgerDate } from "@/lib/ledger";

const dayLabels: Record<string, string> = {
  "2024-05-24": "Имрӯз",
  "2024-05-23": "Дирӯз",
};

function groupByDate(entries: LedgerEntry[]) {
  const groups = new Map<string, LedgerEntry[]>();
  for (const entry of entries) {
    groups.set(entry.date, [...(groups.get(entry.date) ?? []), entry]);
  }
  return [...groups.entries()];
}

export function LedgerCardList({ entries, onOpen, onReset }: { entries: LedgerEntry[]; onOpen: (entry: LedgerEntry) => void; onReset: () => void }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-space-sm rounded-xl bg-surface-container-lowest px-space-md py-space-xl text-center shadow-xs">
        <Icon name="search_off" className="text-4xl text-outline-variant" />
        <p className="font-headline-sm text-body-md font-bold text-on-surface">Амалиёт ёфт нашуд</p>
        <button type="button" onClick={onReset} className="font-body-sm text-body-sm font-semibold text-primary">
          Тоза кардани филтрҳо
        </button>
      </div>
    );
  }

  return (
    <>
      {groupByDate(entries).map(([date, items]) => (
        <div key={date} className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1 pt-2 pb-1">
            <span className="font-label-caps text-label-caps font-bold tracking-wider text-outline uppercase">
              {dayLabels[date] ? `${dayLabels[date]}, ${formatLedgerDate(date, false)}` : formatLedgerDate(date)}
            </span>
            <span className="font-label-caps text-label-caps font-medium text-on-surface-variant">{items.length} сабт</span>
          </div>
          {items.map((entry) => {
            const category = categories[entry.category];
            const source = sources[entry.source];
            const amount = formatSomoni(entry.amount, { sign: true, unit: false });
            const tone = entry.amount < 0 ? "text-error" : "text-primary";
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onOpen(entry)}
                className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-3 text-left shadow-xs transition-transform active:scale-[0.99]"
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", category.iconClassName)}>
                      <Icon name={category.icon} className="text-[20px]" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-headline-sm text-body-md font-bold text-on-surface">{entry.shortTitle}</span>
                      <div className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
                        <span className="truncate">{category.mobileLabel}</span>
                        <span>•</span>
                        <span className="shrink-0">{entry.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={cn("font-tabular-ledger text-tabular-ledger font-bold tnum", tone)}>{amount}</span>{" "}
                    <span className={cn("font-body-sm text-body-sm", tone)}>смн</span>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between pt-1">
                  <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-label-caps text-label-caps font-semibold", source.tagClassName)}>
                    <Icon name={entry.source === "voice" ? "mic" : source.icon} className="text-[13px]" />
                    {source.mobileLabel}
                  </span>
                  <span className="font-body-sm text-body-sm text-outline">Чек #{entry.id}</span>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </>
  );
}
