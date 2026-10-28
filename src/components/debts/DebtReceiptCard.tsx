import { ZigzagEdge } from "@/components/receipt/ZigzagEdge";
import { Icon } from "@/components/ui/Icon";
import type { DebtReceipt } from "@/data/debts";
import { formatLedgerDate } from "@/lib/ledger";
import { formatNumber, formatSomoni } from "@/lib/format";
import { cn } from "@/lib/cn";

function receiptTotal(receipt: DebtReceipt) {
  return receipt.items.reduce((sum, item) => sum + item.total, 0);
}

export function DebtReceiptCard({ receipt }: { receipt: DebtReceipt | undefined }) {
  if (!receipt) {
    return (
      <div className="flex flex-col items-center gap-space-xs rounded-2xl bg-surface-container-lowest p-space-lg text-center shadow-xs">
        <Icon name="receipt_long" className="text-3xl text-outline-variant" />
        <p className="font-body-md text-body-md text-on-surface-variant">Барои ин муштарӣ расиди насия ҳанӯз нест.</p>
      </div>
    );
  }
  const total = receiptTotal(receipt);
  return (
    <section aria-label={`Расиди насия № ${receipt.id}`} className="relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-md">
      <div className="h-2 w-full bg-linear-to-r from-primary via-primary-container to-tertiary-container" />
      <div className="space-y-space-md p-space-lg">
        <div className="flex items-start justify-between gap-space-sm">
          <div>
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm font-extrabold tracking-tight text-on-surface uppercase">Расиди насия № {receipt.id}</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-label-caps text-label-caps font-bold text-primary">Тасдиқшуда</span>
            </div>
            <p className="mt-0.5 font-body-sm text-body-sm text-outline">
              {formatLedgerDate(receipt.date)} • {receipt.time} • {receipt.place}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="font-label-caps text-label-caps text-outline uppercase">Тарзи воридот</span>
            <p className="flex items-center justify-end gap-1 font-body-sm text-body-sm font-semibold text-primary">
              <Icon name={receipt.source === "voice" ? "mic" : "edit_note"} className="text-sm" />
              {receipt.source === "voice" ? "Сабти овозӣ (AI)" : "Қайди дастӣ"}
            </p>
          </div>
        </div>
        <div className="relative py-1">
          <div className="w-full border-t-2 border-dashed border-outline-variant/50" />
          <div className="absolute -top-2 -left-6 h-4 w-4 rounded-full bg-surface" />
          <div className="absolute -top-2 -right-6 h-4 w-4 rounded-full bg-surface" />
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="font-label-caps text-label-caps tracking-wider text-outline uppercase">
              <th scope="col" className="pb-1 font-normal">Мол / Хизматрасонӣ</th>
              <th scope="col" className="pb-1 font-normal">Миқдор</th>
              <th scope="col" className="pb-1 font-normal">Нарх</th>
              <th scope="col" className="pb-1 text-right font-normal">Маблағ</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md text-on-surface">
            {receipt.items.map((item, index) => (
              <tr key={item.name} className={cn(index % 2 === 0 && "bg-surface-container-low/40")}>
                <td className="rounded-l-lg px-space-xs py-2 font-medium">{item.name}</td>
                <td className="px-space-xs py-2 text-outline">{item.quantity}</td>
                <td className="px-space-xs py-2 tnum">{formatSomoni(item.price)}</td>
                <td className="rounded-r-lg px-space-xs py-2 text-right font-bold tnum">{formatSomoni(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="my-2 w-full border-t-2 border-dashed border-outline-variant/40" />
        <div className="flex items-end justify-between pt-1">
          <div>
            <span className="font-label-caps text-label-caps text-outline uppercase">Имзои гирандаи мол</span>
            <div className="mt-1 flex items-center gap-space-xs">
              <div className="flex rotate-[-3deg] items-center gap-1 rounded-sm border-2 border-primary/40 px-2.5 py-1 text-xs font-bold tracking-widest text-primary uppercase">
                <Icon name="verified" className="text-sm" /> Қабул шуд
              </div>
              <span className="font-body-sm text-body-sm text-outline-variant italic">{receipt.signedBy}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-label-caps text-label-caps text-outline uppercase">Ҷамъи қарзи ин сабт</span>
            <div className="font-headline-lg text-headline-lg font-extrabold text-on-surface tnum">
              {formatNumber(total)} <span className="font-body-md text-body-md text-tertiary">смн</span>
            </div>
          </div>
        </div>
      </div>
      <ZigzagEdge className="h-3" />
    </section>
  );
}

export function DebtReceiptMini({ receipt }: { receipt: DebtReceipt | undefined }) {
  if (!receipt) {
    return <p className="rounded-xl bg-surface-container-low p-space-md text-center font-body-sm text-body-sm text-on-surface-variant">Расиди насия ҳанӯз нест.</p>;
  }
  return (
    <div className="relative rounded-xl bg-surface-container-low p-space-md shadow-inner">
      <div className="mb-2 flex items-center justify-between gap-space-xs">
        <span className="font-label-caps text-label-caps font-semibold tracking-wider text-outline uppercase">Расиди насия № {receipt.id}</span>
        <span className="font-label-caps text-label-caps font-semibold text-secondary">
          {formatLedgerDate(receipt.date)} • {receipt.time}
        </span>
      </div>
      <div className="my-2 border-t border-dashed border-outline-variant" />
      <div className="space-y-1.5 font-body-sm text-body-sm">
        {receipt.items.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-space-sm text-on-surface">
            <span>{item.name}</span>
            <span className="shrink-0 font-tabular-ledger font-semibold tnum">{formatSomoni(item.total)}</span>
          </div>
        ))}
      </div>
      <div className="my-2.5 border-t border-dashed border-outline-variant" />
      <div className="flex items-center justify-between font-headline-sm text-body-md font-bold text-on-surface">
        <span>Ҷамъи қарз:</span>
        <span className="text-headline-sm text-primary tnum">{formatSomoni(receiptTotal(receipt))}</span>
      </div>
      <ZigzagEdge className="mt-3 h-2.5 text-surface-container-lowest" />
    </div>
  );
}
