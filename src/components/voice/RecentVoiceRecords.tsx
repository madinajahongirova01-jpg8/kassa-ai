import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { recentVoiceRecords } from "@/data/voice";
import { cn } from "@/lib/cn";
import { formatSomoni } from "@/lib/format";

export function RecentVoiceRecords() {
  return (
    <div className="flex flex-col gap-space-sm pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon name="history" className="text-[20px] text-primary" />
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Сабтҳои охирини овозӣ</h2>
        </div>
        <Link href="/app/transactions" className="font-body-sm text-body-sm font-semibold text-primary">
          Ҳамааш (14)
        </Link>
      </div>
      {recentVoiceRecords.map((record) => (
        <div
          key={record.id}
          className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-3 shadow-xs transition-colors active:bg-surface-container-low"
        >
          <div className="flex min-w-0 items-start gap-2.5">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <Icon name="graphic_eq" className="text-[20px]" />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-body-md text-body-md font-semibold text-on-surface">{record.text}</span>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="font-body-sm text-body-sm text-on-surface-variant">{record.time}</span>
                <span className="inline-flex items-center gap-1 font-label-caps text-label-caps font-bold text-primary">
                  <Icon name="verified" className="text-[13px]" />
                  Тасдиқ шуд
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end pl-2">
            <span
              className={cn(
                "font-tabular-ledger text-tabular-ledger font-bold tnum",
                record.amount < 0 ? "text-error" : "text-on-surface",
              )}
            >
              {formatSomoni(record.amount, { sign: true })}
            </span>
            <span className="font-label-caps text-label-caps text-on-surface-variant">{record.ledger}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
