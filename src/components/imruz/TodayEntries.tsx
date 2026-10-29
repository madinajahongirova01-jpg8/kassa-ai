import Link from "next/link";
import { Receipt, ReceiptDivider } from "@/components/daftar/Receipt";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { signedCashAmount, type TodayCashEntry } from "@/lib/todayCash";

export function TodayEntries({ entries }: { entries: TodayCashEntry[] }) {
  return (
    <Receipt className="px-5 pt-6 pb-8 text-sm lg:px-7 lg:text-[15px]">
      <h2 className="font-display text-lg font-bold lg:text-xl">Сабтҳои имрӯз</h2>
      <ReceiptDivider className="mt-3 mb-1" />
      {entries.length === 0 ? (
        <p className="py-4 font-sans text-ink-2">
          Имрӯз ҳоло сабт нест.{" "}
          <Link href="/app/new" className="font-semibold text-pen underline">
            Сабти нав
          </Link>
        </p>
      ) : (
        entries.map((entry, index) => (
          <div
            key={entry.id}
            className={cn("flex items-center gap-3 py-2.5", index < entries.length - 1 && "border-b border-dotted border-line")}
          >
            <span className="w-11 shrink-0 text-xs text-ink-3">{entry.time}</span>
            <span className="min-w-0 flex-1 truncate">{entry.title}</span>
            <span className={cn("shrink-0 font-bold", entry.kind === "income" ? "text-green" : "text-red")}>
              {formatMoney(signedCashAmount(entry), { sign: true, unit: false })}
            </span>
          </div>
        ))
      )}
    </Receipt>
  );
}
