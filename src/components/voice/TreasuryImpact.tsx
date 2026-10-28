import { Icon } from "@/components/ui/Icon";
import { voiceReceiptItems } from "@/data/voice";
import { formatSomoni } from "@/lib/format";

export function TreasuryImpact() {
  const cash = voiceReceiptItems.reduce((sum, item) => sum + item.amount, 0);
  const closedDebt = voiceReceiptItems
    .filter((item) => item.kind === "debt")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="flex flex-col items-center justify-between gap-space-md rounded-xl bg-surface-container p-space-md md:flex-row">
      <div className="flex items-center gap-space-sm">
        <Icon name="account_balance_wallet" className="text-2xl text-primary" />
        <div>
          <p className="font-headline-sm text-headline-sm font-bold text-on-surface">Таъсир ба хазина</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Баъди тасдиқи ин сабтҳо</p>
        </div>
      </div>
      <div className="flex w-full items-center justify-end gap-space-md md:w-auto">
        <div className="rounded-lg bg-surface-container-lowest px-space-md py-space-xs text-right">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Хазинаи нақдӣ</span>
          <p className="font-tabular-ledger text-tabular-ledger font-bold text-primary tnum">
            {formatSomoni(cash, { sign: true })}
          </p>
        </div>
        <div className="rounded-lg bg-surface-container-lowest px-space-md py-space-xs text-right">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Насияи пӯшидашуда</span>
          <p className="font-tabular-ledger text-tabular-ledger font-bold text-tertiary-container tnum">
            {formatSomoni(-closedDebt)}
          </p>
        </div>
      </div>
    </div>
  );
}
