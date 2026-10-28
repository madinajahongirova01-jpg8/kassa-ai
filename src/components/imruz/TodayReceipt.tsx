import Link from "next/link";
import { HandNote } from "@/components/daftar/HandNote";
import { MicIcon, TextIcon } from "@/components/daftar/icons";
import { Receipt, ReceiptDivider } from "@/components/daftar/Receipt";
import { Stamp } from "@/components/daftar/Stamp";
import type { DayEntry } from "@/data/imruz";
import { cn } from "@/lib/cn";
import { formatSomoni } from "@/lib/format";
import { daySummary, signedAmount } from "@/lib/imruz";

function EntryAmount({ entry }: { entry: DayEntry }) {
  if (entry.kind === "debt") {
    return <span className="font-bold text-pen">{formatSomoni(entry.amount, { unit: false })} қарз</span>;
  }
  return (
    <span className={cn("font-bold", entry.kind === "income" ? "text-green" : "text-red")}>
      {formatSomoni(signedAmount(entry), { sign: true, unit: false })}
    </span>
  );
}

export function TodayReceipt({ entries }: { entries: DayEntry[] }) {
  const summary = daySummary(entries);
  return (
    <Receipt className="flex min-h-0 flex-1 flex-col px-[22px] pt-[26px] pb-[30px] text-[13px]">
      <div className="text-center font-display text-[15px] font-bold tracking-[0.06em]">ДАФТАРИ ИМРӮЗ</div>
      <div className="mt-1 text-center text-[11px] text-ink-2">Kassa AI худаш навишт · {entries.length} сабт</div>
      <ReceiptDivider className="mt-3.5 mb-1.5" />
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className={cn("flex items-center gap-2.5 py-[9px]", index < entries.length - 1 && "border-b border-dotted border-line")}
        >
          <span className="w-[38px] text-[11px] text-ink-3">{entry.time}</span>
          {entry.source === "voice" ? <MicIcon className="text-pen" label="овоз" /> : <TextIcon className="text-ink-3" label="матн" />}
          <span className="flex-1 truncate">{entry.title}</span>
          <EntryAmount entry={entry} />
        </div>
      ))}
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-4 text-center">
        <HandNote className="-rotate-3 text-[22px] leading-tight">
          {summary.voiceCount} бо овоз, {summary.textCount} бо матн —
          <br />
          ягон қалам лозим нашуд :)
        </HandNote>
        <Stamp className="self-end">ТАСДИҚ ШУД ✓</Stamp>
      </div>
      <ReceiptDivider className="mt-2 mb-2.5" />
      <div className="flex justify-between py-[3px] text-ink-2">
        <span>Даромад</span>
        <span>{formatSomoni(summary.income, { unit: false })}</span>
      </div>
      <div className="flex justify-between py-[3px] text-ink-2">
        <span>Хароҷот</span>
        <span>{formatSomoni(summary.expense, { unit: false })}</span>
      </div>
      <div className="flex justify-between pt-2 text-lg font-bold">
        <span>ФОИДА</span>
        <span className={summary.profit >= 0 ? "text-green" : "text-red"}>{formatSomoni(summary.profit, { sign: true, unit: false })}</span>
      </div>
      <div aria-hidden className="mt-3.5 text-center text-[11px] tracking-[0.3em] text-ink-3">
        ||| | || ||| | ||| || |
      </div>
    </Receipt>
  );
}

export function TodayReceiptMobile({ entries, limit = 3 }: { entries: DayEntry[]; limit?: number }) {
  const shown = [...entries]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
    .sort((a, b) => a.time.localeCompare(b.time));
  return (
    <Receipt className="rounded-t-tile px-4 pt-4 pb-6 text-[12.5px] drop-shadow-[0_10px_16px_rgba(27,35,64,0.14)]">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-[13px] font-bold tracking-[0.05em]">ДАФТАРИ ИМРӮЗ</span>
        <span className="text-[11px] text-ink-3">{entries.length} сабт</span>
      </div>
      <ReceiptDivider className="mt-2.5 mb-1" />
      {shown.map((entry, index) => (
        <div key={entry.id} className={cn("flex gap-2 py-1.5", index < shown.length - 1 && "border-b border-dotted border-line")}>
          <span className="w-[34px] text-[11px] text-ink-3">{entry.time}</span>
          <span className="min-w-0 flex-1 truncate">{entry.shortTitle}</span>
          <EntryAmount entry={entry} />
        </div>
      ))}
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center">
        <span />
        <Link href="/app/transactions" className="border-b-[1.5px] border-ink font-sans text-xs font-semibold text-ink hover:text-pen">
          ҳама {entries.length} сабт
        </Link>
        <Stamp size="sm" className="justify-self-end">
          ТАСДИҚ ✓
        </Stamp>
      </div>
    </Receipt>
  );
}
