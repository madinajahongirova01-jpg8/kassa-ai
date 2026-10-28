"use client";

import { useState } from "react";
import { DebtDialog, dialogCancel, dialogInput, dialogLabel, dialogSubmit } from "@/components/debts/DebtDialog";
import { Icon } from "@/components/ui/Icon";
import { repaymentMethods, type DebtCustomer, type RepaymentMethod } from "@/data/debts";
import { amountInWords } from "@/lib/amountInWords";
import { cn } from "@/lib/cn";
import { formatSomoni } from "@/lib/format";

type RepaymentDialogProps = {
  customer: DebtCustomer;
  balance: number;
  onClose: () => void;
  onConfirm: (amount: number, method: RepaymentMethod) => void;
};

export function RepaymentDialog({ customer, balance, onClose, onConfirm }: RepaymentDialogProps) {
  const [amount, setAmount] = useState(String(balance));
  const [method, setMethod] = useState<RepaymentMethod>("Нақд");
  const value = Number(amount || 0);
  const valid = value > 0 && value <= balance;

  return (
    <DebtDialog
      title="Қабули пардохт"
      icon="payments"
      onClose={onClose}
      onSubmit={() => valid && onConfirm(value, method)}
      footer={
        <>
          <button type="button" onClick={onClose} className={dialogCancel}>
            Бекор кардан
          </button>
          <button type="submit" disabled={!valid} className={dialogSubmit}>
            <Icon name="check_circle" className="text-base" />
            Пардохтро сабт кардан
          </button>
        </>
      }
    >
      <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-space-md">
        <div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Муштарӣ</p>
          <p className="font-headline-sm text-headline-sm font-bold text-on-surface">{customer.name}</p>
        </div>
        <div className="text-right">
          <p className="font-body-sm text-body-sm text-on-surface-variant">Қарзи ҷорӣ</p>
          <p className="font-headline-sm text-headline-sm font-extrabold text-tertiary tnum">{formatSomoni(balance)}</p>
        </div>
      </div>
      <div>
        <label htmlFor="repayment-amount" className={dialogLabel}>
          Маблағи пардохт (смн)
        </label>
        <input
          id="repayment-amount"
          inputMode="numeric"
          autoFocus
          value={amount}
          onChange={(event) => setAmount(event.target.value.replace(/\D/g, "").slice(0, 7))}
          className={cn(dialogInput, "font-headline-md text-headline-md font-extrabold tnum")}
        />
        <p className={cn("mt-1 font-body-sm text-body-sm", value > balance ? "text-error" : "text-on-surface-variant")}>
          {value > balance
            ? `Маблағ аз қарз зиёд аст (ҳадди аксар ${formatSomoni(balance)})`
            : value > 0
              ? amountInWords(value)
              : "Маблағро ворид кунед"}
        </p>
        <div className="mt-space-xs flex gap-space-xs">
          <button
            type="button"
            onClick={() => setAmount(String(balance))}
            className="rounded-full bg-surface-container px-3 py-1 font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container-high"
          >
            Пурра
          </button>
          {balance >= 2 && (
            <button
              type="button"
              onClick={() => setAmount(String(Math.round(balance / 2)))}
              className="rounded-full bg-surface-container px-3 py-1 font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container-high"
            >
              Нисф
            </button>
          )}
        </div>
      </div>
      <div>
        <span className={dialogLabel}>Тарзи пардохт</span>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-container p-1">
          {repaymentMethods.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={method === item}
              onClick={() => setMethod(item)}
              className={cn(
                "rounded-lg py-2 font-body-sm text-body-sm transition-colors",
                method === item ? "bg-surface-container-lowest font-bold text-primary shadow-xs" : "text-on-surface-variant",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <p className="font-body-sm text-body-sm text-outline">
        Пардохт танҳо дар дафтари намунавии ҳамин саҳифа қайд мешавад.
      </p>
    </DebtDialog>
  );
}
