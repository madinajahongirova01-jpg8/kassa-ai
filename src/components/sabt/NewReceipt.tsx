"use client";

import Link from "next/link";
import { HandNote } from "@/components/daftar/HandNote";
import { Receipt, ReceiptDivider } from "@/components/daftar/Receipt";
import { Stamp } from "@/components/daftar/Stamp";
import { useLocale, useT } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { formatSomoni } from "@/lib/format";
import { cashSabtEntries, debtSabtEntries, type SabtEntry } from "@/lib/sabt";
import { sabtNoteKey } from "@/lib/sabtText";
import { useBusinessNow } from "@/lib/useBusinessNow";

type NewReceiptProps = {
  entries: SabtEntry[];
  profit: number;
  confirmed: boolean;
  onEditRow: () => void;
};

export function NewReceipt({ entries, profit, confirmed, onEditRow }: NewReceiptProps) {
  const t = useT();
  const locale = useLocale();
  const now = useBusinessNow(locale);
  const cash = cashSabtEntries(entries);
  const debts = debtSabtEntries(entries);
  const noteText = (entry: SabtEntry) => {
    const key = sabtNoteKey(entry);
    return key ? t(key) : entry.note;
  };
  return (
    <Receipt className="rotate-1 px-6 pt-6 pb-[34px] text-sm">
      <div className="text-center font-display text-[15px] font-bold tracking-[0.06em]">{t("sabt.receipt.title")}</div>
      <div className="mt-1 min-h-[1.5em] text-center text-[11px] text-ink-2">{now}</div>
      <ReceiptDivider className="mt-4 mb-2" />
      <ul>
        {cash.map((entry) => (
          <li key={entry.id} className="border-b border-dotted border-line last:border-b-0">
            <button
              type="button"
              onClick={onEditRow}
              disabled={confirmed}
              className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:bg-pen-mist/60 disabled:hover:bg-transparent"
            >
              <span className="min-w-0">
                <span className="block">{entry.title}</span>
                <span className="block font-sans text-[11px] text-ink-3">{noteText(entry)}</span>
              </span>
              <span className={cn("font-bold", entry.kind === "income" ? "text-green" : "text-red")}>
                {formatSomoni(entry.kind === "income" ? entry.amount : -entry.amount, { sign: true, unit: false, locale })}
              </span>
            </button>
          </li>
        ))}
        {cash.length === 0 && <li className="py-6 text-center font-sans text-ink-3">{t("sabt.receipt.empty")}</li>}
      </ul>
      {debts.length > 0 && (
        <div role="note" className="mt-3 rounded-tile border-[1.5px] border-dashed border-ink-3 px-3 py-2.5 font-sans">
          <ul className="text-ink-2">
            {debts.map((entry) => (
              <li key={entry.id} className="flex justify-between gap-3 py-0.5">
                <span className="min-w-0 truncate">{entry.title}</span>
                <span className="font-bold">{formatSomoni(entry.amount, { unit: false, locale })}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-ink-2">
            {t("sabt.receipt.debtBefore")}
            <Link href="/app/debts" className="font-semibold text-pen underline">
              {t("nav.debts")}
            </Link>
            {t("sabt.receipt.debtAfter")}
          </p>
        </div>
      )}
      <ReceiptDivider className="mt-2.5 mb-3" />
      <div className="flex justify-between text-[22px] font-bold">
        <span>{profit >= 0 ? t("sabt.receipt.profit") : t("sabt.receipt.loss")}</span>
        <span className={profit >= 0 ? "text-green" : "text-red"}>{formatSomoni(profit, { sign: true, unit: false, locale })}</span>
      </div>
      <HandNote tone="muted" className="mt-3 block text-center text-xl">
        {confirmed ? t("sabt.receipt.saved") : t("sabt.receipt.tapToFix")}
      </HandNote>
      {confirmed && (
        <div className="mt-3 text-center">
          <Stamp>{t("sabt.receipt.stamp")}</Stamp>
        </div>
      )}
    </Receipt>
  );
}
