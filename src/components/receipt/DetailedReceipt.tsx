import { Barcode } from "@/components/receipt/Barcode";
import { ZigzagEdge } from "@/components/receipt/ZigzagEdge";
import { Icon } from "@/components/ui/Icon";
import { voiceSession, type VoiceReceiptItem, type VoiceReceiptKind } from "@/data/voice";
import { cn } from "@/lib/cn";
import { formatSomoni } from "@/lib/format";
import type { ReactNode } from "react";

const kindStyles: Record<
  VoiceReceiptKind,
  { label: string; mobileLabel: string; pill: string; icon: string; row: string; amount: string; labelClass: string }
> = {
  expense: {
    label: "Хароҷот",
    mobileLabel: "Баромад",
    pill: "bg-surface-container text-on-surface-variant",
    icon: "bg-error-container text-on-error-container",
    row: "bg-surface-container-low lg:bg-transparent",
    amount: "text-error",
    labelClass: "text-on-surface-variant lg:text-outline",
  },
  income: {
    label: "Даромад",
    mobileLabel: "Даромад",
    pill: "bg-secondary-container font-semibold text-on-secondary-container",
    icon: "bg-primary-container text-on-primary-container",
    row: "bg-secondary-container/40 lg:bg-transparent",
    amount: "text-primary",
    labelClass: "font-bold text-primary lg:font-normal",
  },
  debt: {
    label: "Насияи пӯшида",
    mobileLabel: "Насия",
    pill: "bg-tertiary-fixed font-semibold text-on-tertiary-fixed",
    icon: "bg-tertiary-fixed text-on-tertiary-fixed",
    row: "bg-tertiary-fixed/30 lg:bg-transparent",
    amount: "text-primary",
    labelClass: "font-bold text-tertiary",
  },
};

function ReceiptRow({ item, index }: { item: VoiceReceiptItem; index: number }) {
  const style = kindStyles[item.kind];
  return (
    <div className={cn("flex items-center justify-between gap-space-sm rounded-lg p-2 lg:items-start lg:p-0", style.row)}>
      <div className="flex min-w-0 items-center gap-2 lg:block lg:space-y-0.5">
        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md lg:hidden", style.icon)}>
          <Icon name={item.icon} className="text-[16px]" />
        </div>
        <div className="flex min-w-0 flex-col lg:block">
          <p className="truncate font-body-md text-body-md font-semibold text-on-surface lg:whitespace-normal">
            <span className="lg:hidden">{item.shortTitle}</span>
            <span className="hidden lg:inline">
              {index + 1}. {item.title}
            </span>
          </p>
          <span className="font-body-sm text-body-sm text-on-surface-variant lg:hidden">{item.category}</span>
          <span className={cn("hidden rounded-sm px-1.5 py-0.5 font-label-caps text-label-caps lg:inline-block", style.pill)}>
            {item.category}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <p className={cn("font-tabular-ledger text-tabular-ledger font-bold tnum", style.amount)}>
          <span className="lg:hidden">{formatSomoni(item.amount, { sign: true })}</span>
          <span className="hidden lg:inline">{formatSomoni(item.amount, { sign: true, unit: false })}</span>
        </p>
        <span className={cn("font-label-caps text-label-caps", style.labelClass)}>
          <span className="lg:hidden">{style.mobileLabel}</span>
          <span className="hidden lg:inline">{style.label}</span>
        </span>
      </div>
    </div>
  );
}

export function DetailedReceipt({ items, actions }: { items: VoiceReceiptItem[]; actions?: ReactNode }) {
  const income = items.filter((i) => i.amount > 0).reduce((s, i) => s + i.amount, 0);
  const expense = items.filter((i) => i.amount < 0).reduce((s, i) => s + i.amount, 0);
  const net = income + expense;

  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-t-2xl bg-surface-container-lowest text-inverse-surface shadow-xl lg:max-w-md lg:rounded-t-xl lg:bg-[#FFFDF7]">
      <div className="h-2 w-full bg-primary lg:bg-transparent lg:bg-linear-to-r lg:from-surface-variant/40 lg:via-surface-variant/10 lg:to-surface-variant/40" />
      <div className="flex-1 space-y-space-md p-space-md lg:p-space-lg">
        <div className="flex items-start justify-between lg:hidden">
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps font-extrabold tracking-widest text-primary uppercase">
              Kassa AI • Чеки ҳушманд
            </span>
            <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">
              ЧЕК {voiceSession.receiptNumber}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-body-sm text-body-sm font-medium text-on-surface-variant">{voiceSession.receiptTime}</span>
            <span className="mt-1 rounded-full bg-secondary-container px-2 py-0.5 font-label-caps text-label-caps font-semibold text-on-secondary-container">
              {voiceSession.shopShort}
            </span>
          </div>
        </div>

        <div className="hidden space-y-1 pb-space-sm text-center lg:block">
          <div className="mx-auto mb-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary">
            <Icon name="receipt_long" className="text-2xl" />
          </div>
          <h2 className="font-headline-sm text-headline-sm font-extrabold tracking-tight text-primary uppercase">
            Чеки ҳушманди Kassa AI
          </h2>
          <div className="flex items-center justify-center gap-space-xs font-label-caps text-label-caps tracking-wider text-on-surface-variant">
            <span>РАҚАМИ ЧЕК:</span>
            <span className="font-tabular-ledger text-tabular-ledger font-bold text-on-surface">{voiceSession.receiptNumber}</span>
          </div>
          <p className="font-body-sm text-body-sm text-outline">
            {voiceSession.receiptTime} • {voiceSession.shop}
          </p>
        </div>

        <div className="relative flex items-center justify-between py-1 lg:py-0">
          <div className="-ml-5 h-3 w-3 rounded-full bg-surface shadow-inner lg:hidden" />
          <div className="mx-1 flex-1 border-t-2 border-dashed border-outline-variant lg:mx-0 lg:border-t" />
          <div className="-mr-5 h-3 w-3 rounded-full bg-surface shadow-inner lg:hidden" />
        </div>

        <div className="flex flex-col gap-2.5 lg:gap-space-md">
          <div className="hidden items-center justify-between font-label-caps text-label-caps font-semibold text-outline uppercase lg:flex">
            <span>Тавсифи амалиёт</span>
            <span>Маблағ (смн)</span>
          </div>
          {items.map((item, index) => (
            <ReceiptRow key={item.id} item={item} index={index} />
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 pt-1 text-outline lg:hidden">
          <Icon name="content_cut" className="text-[16px]" />
          <span className="font-label-caps text-label-caps font-semibold tracking-widest uppercase">- - - Хатти буриш - - -</span>
        </div>
        <div className="hidden h-px w-full border-t border-dashed border-outline-variant lg:block" />

        <div className="hidden space-y-space-xs font-body-sm text-body-sm lg:block">
          <div className="flex justify-between text-on-surface-variant">
            <span>Умумии даромад:</span>
            <span className="font-tabular-ledger text-tabular-ledger font-semibold text-primary tnum">
              {formatSomoni(income, { sign: true })}
            </span>
          </div>
          <div className="flex justify-between text-on-surface-variant">
            <span>Умумии хароҷот:</span>
            <span className="font-tabular-ledger text-tabular-ledger font-semibold text-error tnum">
              {formatSomoni(expense)}
            </span>
          </div>
          <div className="mt-space-sm flex items-center justify-between rounded-lg bg-primary/5 p-space-sm">
            <div>
              <p className="font-label-caps text-label-caps font-bold text-primary uppercase">Соф фоидаи амалиёт</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Кассаи соф барои имрӯз</p>
            </div>
            <span className="font-headline-md text-headline-md font-black tracking-tight text-primary tnum">
              {formatSomoni(net, { sign: true })}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-surface-container p-space-md text-center lg:hidden">
          <span className="font-label-caps text-label-caps font-bold tracking-wider text-on-surface-variant uppercase">
            Соф фоидаи ҳисобшуда
          </span>
          <div className="flex items-baseline gap-1.5 text-primary">
            <span className="font-headline-lg text-headline-lg font-black tracking-tight tnum">
              {formatSomoni(net, { sign: true, unit: false })}
            </span>
            <span className="font-headline-sm text-headline-sm font-bold">смн</span>
          </div>
          <span className="font-body-sm text-body-sm font-medium text-secondary">
            Ҳамаи {items.length} сабт ба тавозуни умумӣ ҳамроҳ мешаванд
          </span>
        </div>

        {actions && <div className="lg:hidden">{actions}</div>}

        <Barcode code={voiceSession.barcode} />
      </div>
      <ZigzagEdge className="h-3 lg:h-4" />
    </div>
  );
}
