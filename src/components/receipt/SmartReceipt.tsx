import type { Receipt } from "@/data/types";
import { ZigzagEdge } from "@/components/receipt/ZigzagEdge";
import { TearLine } from "@/components/receipt/TearLine";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { formatSomoni } from "@/lib/format";

export function SmartReceipt({ receipt, className }: { receipt: Receipt; className?: string }) {
  const net = receipt.lines.reduce((sum, line) => sum + line.amount, 0);

  return (
    <section
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest shadow-md",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-surface-container bg-surface-container-low px-space-md py-space-sm lg:block lg:border-0 lg:p-space-md lg:pb-space-sm">
        <div className="flex items-center justify-between gap-space-sm">
          <div className="flex min-w-0 items-center gap-space-xs">
            <Icon name="receipt" className="text-[18px] text-primary lg:text-lg" />
            <span className="truncate font-label-caps text-label-caps font-bold text-on-surface uppercase lg:font-headline-sm lg:text-headline-sm lg:normal-case">
              {receipt.title}
            </span>
          </div>
          <span className="hidden shrink-0 rounded-sm bg-secondary-container px-2 py-0.5 font-label-caps text-label-caps font-semibold text-on-secondary-container lg:inline">
            {receipt.time}
          </span>
        </div>
        <p className="mt-0.5 hidden font-body-sm text-body-sm text-outline lg:block">{receipt.subtitle}</p>
        <span className="font-body-sm text-body-sm font-medium text-on-surface-variant lg:hidden">
          {receipt.time}
        </span>
      </div>

      <div className="space-y-space-sm p-space-md lg:space-y-space-xs">
        {receipt.lines.map((line) => {
          const income = line.amount > 0;
          return (
            <div key={line.label} className="flex items-center justify-between lg:py-1">
              <span
                className={cn(
                  "flex items-center gap-2 font-body-md text-body-md text-on-surface lg:gap-1.5",
                  income && "font-semibold lg:font-medium",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full lg:h-1.5 lg:w-1.5", income ? "bg-primary" : "bg-error")} />
                {line.label}
              </span>
              <span
                className={cn(
                  "font-tabular-ledger text-tabular-ledger tnum",
                  income ? "font-bold text-primary" : "text-error",
                )}
              >
                {formatSomoni(line.amount, { sign: true })}
              </span>
            </div>
          );
        })}

        <TearLine />

        <div className="flex items-center justify-between pt-1">
          <span className="font-headline-sm text-body-md font-bold text-on-surface lg:text-headline-sm">
            Соф фоидаи рӯз:
          </span>
          <span className="font-tabular-ledger text-headline-sm font-bold tracking-tight text-primary tnum lg:font-headline-lg lg:text-headline-lg">
            {formatSomoni(net, { sign: true })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-space-sm pt-space-sm lg:hidden">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-surface-container py-2.5 font-headline-sm text-body-sm font-semibold text-on-surface transition-colors active:bg-surface-variant"
          >
            <Icon name="edit" className="text-[18px]" />
            Ислоҳ
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-tertiary-container py-2.5 font-headline-sm text-body-sm font-semibold text-on-tertiary shadow-xs transition-opacity active:opacity-90"
          >
            <Icon name="check_circle" className="text-[18px]" />
            Тасдиқ
          </button>
        </div>
      </div>

      <div className="hidden items-center gap-space-sm px-space-md pt-space-xs pb-space-md lg:flex">
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-tertiary py-2.5 font-headline-sm text-headline-sm text-on-tertiary shadow-sm transition-opacity hover:opacity-95"
        >
          <Icon name="check_circle" className="text-base" />
          Тасдиқ
        </button>
        <button
          type="button"
          className="rounded-lg bg-surface-container-high px-space-md py-2.5 font-body-md text-body-md text-on-surface transition-colors hover:bg-surface-container-highest"
        >
          Ислоҳ
        </button>
      </div>

      <ZigzagEdge />
    </section>
  );
}
