"use client";

import { useState } from "react";
import { DebtDialog, dialogCancel } from "@/components/debts/DebtDialog";
import { Icon } from "@/components/ui/Icon";
import type { DebtCustomer } from "@/data/debts";
import { cn } from "@/lib/cn";
import { formatSomoni } from "@/lib/format";

export type ReminderChannel = "SMS" | "Telegram" | "Нусха";

type ReminderTarget = { customer: DebtCustomer; balance: number; text: string };

type ReminderDialogProps = {
  targets: ReminderTarget[];
  bulk?: boolean;
  onClose: () => void;
  onPrepared: (customerId: string, channel: ReminderChannel) => void;
};

function smsHref(phone: string, text: string) {
  return `sms:${phone.replace(/\s/g, "")}?body=${encodeURIComponent(text)}`;
}

function telegramHref(text: string) {
  return `https://t.me/share/url?url=${encodeURIComponent("Kassa AI")}&text=${encodeURIComponent(text)}`;
}

const linkClass =
  "flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 font-body-sm text-body-sm font-semibold transition-colors";

export function ReminderDialog({ targets, bulk = false, onClose, onPrepared }: ReminderDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, text: string, customerIds: string[]) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      customerIds.forEach((id) => onPrepared(id, "Нусха"));
    } catch {
      setCopied(null);
    }
  };

  return (
    <DebtDialog
      title={bulk ? "Ёдраскунии оммавӣ" : "Ёдраскунӣ"}
      icon={bulk ? "forward_to_inbox" : "chat"}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={dialogCancel}>
            Пӯшидан
          </button>
          {bulk && targets.length > 0 && (
            <button
              type="button"
              onClick={() => copy("all", targets.map((t) => `${t.customer.name} (${t.customer.phone}):\n${t.text}`).join("\n\n"), targets.map((t) => t.customer.id))}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2.5 font-body-sm text-body-sm font-bold text-on-primary shadow-md hover:bg-primary-container"
            >
              <Icon name={copied === "all" ? "done_all" : "content_copy"} className="text-base" />
              {copied === "all" ? "Нусха шуд" : "Нусхаи ҳама"}
            </button>
          )}
        </>
      }
    >
      <p className="rounded-lg bg-secondary-container/50 px-3 py-2 font-body-sm text-body-sm text-on-secondary-container">
        Kassa AI паёмро омода мекунад. Онро шумо худатон тавассути SMS ё Telegram-и телефон мефиристед.
      </p>
      {targets.length === 0 && (
        <p className="py-space-md text-center font-body-md text-body-md text-on-surface-variant">Ҳоло қарздори фаъол нест.</p>
      )}
      {targets.map((target) => (
        <div key={target.customer.id} className="space-y-space-xs rounded-xl bg-surface-container-low p-space-sm">
          <div className="flex items-center justify-between gap-space-sm">
            <div className="min-w-0">
              <p className="truncate font-body-md text-body-md font-bold text-on-surface">{target.customer.name}</p>
              <p className="font-body-sm text-body-sm text-outline">{target.customer.phone}</p>
            </div>
            <span className="font-tabular-ledger text-tabular-ledger font-bold text-tertiary tnum">{formatSomoni(target.balance)}</span>
          </div>
          <p className="rounded-lg bg-surface-container-lowest p-2 font-body-sm text-body-sm text-on-surface italic">«{target.text}»</p>
          <div className="flex gap-space-xs">
            <a
              href={smsHref(target.customer.phone, target.text)}
              onClick={() => onPrepared(target.customer.id, "SMS")}
              className={cn(linkClass, "bg-surface-container-high text-on-surface hover:bg-surface-container-highest")}
            >
              <Icon name="sms" className="text-base" />
              SMS
            </a>
            <a
              href={telegramHref(target.text)}
              target="_blank"
              rel="noreferrer"
              onClick={() => onPrepared(target.customer.id, "Telegram")}
              className={cn(linkClass, "bg-surface-container-high text-on-surface hover:bg-surface-container-highest")}
            >
              <Icon name="send" className="text-base" />
              Telegram
            </a>
            <button
              type="button"
              onClick={() => copy(target.customer.id, target.text, [target.customer.id])}
              className={cn(linkClass, "bg-tertiary-container text-on-tertiary-container hover:opacity-90")}
            >
              <Icon name={copied === target.customer.id ? "done_all" : "content_copy"} className="text-base" />
              {copied === target.customer.id ? "Нусха шуд" : "Нусха"}
            </button>
          </div>
        </div>
      ))}
    </DebtDialog>
  );
}
