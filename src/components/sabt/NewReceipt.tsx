import { HandNote } from "@/components/daftar/HandNote";
import { Receipt, ReceiptDivider } from "@/components/daftar/Receipt";
import { Stamp } from "@/components/daftar/Stamp";
import { sabtDemo } from "@/data/sabt";
import { cn } from "@/lib/cn";
import { formatSomoni } from "@/lib/format";
import type { SabtEntry } from "@/lib/sabt";

type NewReceiptProps = {
  entries: SabtEntry[];
  profit: number;
  confirmed: boolean;
  onEditRow: () => void;
};

export function NewReceipt({ entries, profit, confirmed, onEditRow }: NewReceiptProps) {
  return (
    <Receipt className="rotate-1 px-6 pt-6 pb-[34px] text-sm">
      <div className="text-center font-display text-[15px] font-bold tracking-[0.06em]">ЧЕКИ НАВ</div>
      <div className="mt-1 text-center text-[11px] text-ink-2">
        №{sabtDemo.receiptNumber} · {sabtDemo.date} · {sabtDemo.time}
      </div>
      <ReceiptDivider className="mt-4 mb-2" />
      <ul>
        {entries.map((entry) => (
          <li key={entry.id} className="border-b border-dotted border-line last:border-b-0">
            <button
              type="button"
              onClick={onEditRow}
              disabled={confirmed}
              className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:bg-pen-mist/60 disabled:hover:bg-transparent"
            >
              <span className="min-w-0">
                <span className="block">{entry.title}</span>
                <span className="block font-sans text-[11px] text-ink-3">{entry.note}</span>
              </span>
              <span className={cn("font-bold", entry.kind === "income" ? "text-green" : "text-red")}>
                {formatSomoni(entry.kind === "income" ? entry.amount : -entry.amount, { sign: true, unit: false })}
              </span>
            </button>
          </li>
        ))}
        {entries.length === 0 && <li className="py-6 text-center font-sans text-ink-3">ҳоло ягон сабт нест</li>}
      </ul>
      <ReceiptDivider className="mt-2.5 mb-3" />
      <div className="flex justify-between text-[22px] font-bold">
        <span>{profit >= 0 ? "ФОИДА" : "ЗАРАР"}</span>
        <span className={profit >= 0 ? "text-green" : "text-red"}>{formatSomoni(profit, { sign: true, unit: false })}</span>
      </div>
      <HandNote tone="muted" className="mt-3 block text-center text-xl">
        {confirmed ? "ба дафтар сабт шуд" : "хато бошад — ба сатр пахш кунед"}
      </HandNote>
      {confirmed && (
        <div className="mt-3 text-center">
          <Stamp>ТАСДИҚ ШУД ✓</Stamp>
        </div>
      )}
    </Receipt>
  );
}
