"use client";

import { useRouter } from "next/navigation";
import { useState, type Ref } from "react";
import { HandNote } from "@/components/daftar/HandNote";
import { postJson, requestErrorText } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { normalizePhone, phoneProblemText, reminderText, smsHref, telHref } from "@/lib/contact";
import { dayMonth, lastPayment, type DebtRow } from "@/lib/debts";
import { formatMoney } from "@/lib/format";
import { toApiAmount } from "@/lib/money";

function dueLine(row: DebtRow, today: string): { tone: "pen" | "red" | "green"; text: string } {
  const due = row.customer.dueDate;
  if (row.status === "paid") {
    const payment = lastPayment(row);
    return { tone: "green", text: payment ? `${dayMonth(payment.date, today)} пурра баргардонд — раҳмат!` : "қарз нест" };
  }
  if (!due || row.daysLeft === null) return { tone: "pen", text: "бе мӯҳлат" };
  const days = row.daysLeft;
  if (days < 0) return { tone: "red", text: `мӯҳлат ${dayMonth(due, today)} буд — ${Math.abs(days)} рӯз гузашт` };
  if (days === 0) return { tone: "pen", text: "мӯҳлат — имрӯз" };
  if (days === 1) return { tone: "pen", text: `мӯҳлат — фардо, ${dayMonth(due, today)}` };
  return { tone: "pen", text: `мӯҳлат то ${dayMonth(due, today)} — ${days} рӯз монд` };
}

const buttonClass = "flex flex-1 items-center justify-center rounded-xl border-[1.5px] border-ink bg-card px-2 text-sm font-semibold whitespace-nowrap text-ink hover:text-pen";

type NasiyaSheetProps = {
  row: DebtRow;
  today: string;
  businessName: string | null;
  editing: boolean;
  onEdit: () => void;
  ref?: Ref<HTMLElement>;
};

export function NasiyaSheet({ row, today, businessName, editing, onEdit, ref }: NasiyaSheetProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ customerId: string; text: string } | null>(null);
  const [phoneNotice, setPhoneNotice] = useState<{ customerId: string; where: "call" | "sms" } | null>(null);
  const { customer, balance, status, history } = row;
  const paid = status === "paid";
  const overdue = status === "overdue";
  const line = dueLine(row, today);
  const firstName = customer.name.trim().split(/\s+/)[0];
  const amount = `${formatMoney(balance, { unit: false })} сомонӣ`;
  const message = reminderText({ name: customer.name, businessName, balance });
  const phone = normalizePhone(customer.phone);
  const phoneProblem = phone.ok ? null : phoneProblemText(phone.reason);
  const noticeAt = (where: "call" | "sms") => phoneProblem !== null && phoneNotice?.customerId === customer.id && phoneNotice.where === where;

  // The whole remaining balance as one payment; the API splits it across the open debts atomically
  // and refuses it (422) if it would exceed what is still owed.
  async function acceptFullPayment() {
    setPending(true);
    setError(null);
    const result = await postJson(`/api/customers/${customer.id}/payments`, { amount: toApiAmount(balance) });
    setPending(false);
    if (!result.ok) {
      setError({ customerId: customer.id, text: requestErrorText(result.status, result.details) });
      return;
    }
    router.refresh();
  }

  return (
    <section
      ref={ref}
      aria-label={`Варақи ${customer.name}`}
      className="relative flex scroll-mt-4 flex-col gap-3.5 rounded-sheet border-[1.5px] border-ink bg-card bg-[linear-gradient(90deg,transparent_30px,var(--color-margin)_30px,var(--color-margin)_31.5px,transparent_31.5px)] py-[22px] pr-[18px] pb-[18px] pl-11 shadow-hard-xl lg:min-h-0 lg:overflow-y-auto lg:pr-[22px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[19px] font-bold">{customer.name}</h2>
          <div className="mt-0.5 text-[13px] text-ink-2">
            {customer.phone}
            {customer.note && ` · ${customer.note}`}
          </div>
          <button
            type="button"
            onClick={onEdit}
            aria-expanded={editing}
            className="mt-1 text-sm font-semibold text-ink-2 hover:text-pen print:hidden"
          >
            ✎ Таҳрир
          </button>
        </div>
        <div className="text-right">
          <div className={cn("font-display text-[30px] leading-tight font-extrabold", overdue && "text-red", paid && "text-green")}>
            {formatMoney(balance, { unit: false })}
          </div>
          <div className="text-[11px] text-ink-2">сомонӣ</div>
        </div>
      </div>

      <HandNote tone={line.tone} className="text-[23px] leading-tight">
        {line.text}
      </HandNote>

      <ul className="flex flex-col font-mono text-[13px]">
        {history.map((event) => (
          <li key={event.id} className="flex gap-3.5 border-b border-grid py-[9px]">
            <span className="w-12 shrink-0 text-ink-3">{dayMonth(event.date, today)}</span>
            <span className="min-w-0 flex-1">{event.note}</span>
            <span className={cn("font-bold", event.type === "payment" && "text-green")}>{formatMoney(event.amount, { unit: false })}</span>
          </li>
        ))}
        <li className="flex gap-3.5 border-b-[1.5px] border-ink py-[9px]">
          <span className="w-12 shrink-0 text-ink-3">имрӯз</span>
          <span className="flex-1 font-bold">Боқимонда</span>
          <span className={cn("font-bold", overdue && "text-red", paid && "text-green")}>{formatMoney(balance, { unit: false })}</span>
        </li>
      </ul>

      <div className="flex gap-2.5">
        <button
          type="button"
          disabled={paid || pending}
          onClick={acceptFullPayment}
          className="h-[46px] flex-1 rounded-tile border-[1.5px] border-ink bg-pen px-2 text-sm font-bold whitespace-nowrap text-card shadow-hard-sm active:translate-x-px active:translate-y-px active:shadow-none disabled:border-line-strong disabled:bg-line disabled:text-ink-3 disabled:shadow-none"
        >
          {pending ? "Сабт мешавад…" : "Пардохт қабул шуд"}
        </button>
        {phone.ok ? (
          <a href={telHref(phone.phone)} className={cn(buttonClass, "h-[46px] rounded-tile")}>
            Занг задан
          </a>
        ) : (
          <button type="button" onClick={() => setPhoneNotice({ customerId: customer.id, where: "call" })} className={cn(buttonClass, "h-[46px] rounded-tile")}>
            Занг задан
          </button>
        )}
      </div>
      {noticeAt("call") && (
        <HandNote tone="red" role="alert" className="text-xl leading-tight">
          {phoneProblem}
        </HandNote>
      )}
      {error?.customerId === customer.id && (
        <HandNote tone="red" role="alert" className="text-xl leading-tight">
          {error.text}
        </HandNote>
      )}

      {!paid && (
        <div className="mt-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-bold">Ёдраскунии мулоим</span>
            <HandNote className="text-xl">бе хиҷолат :)</HandNote>
          </div>
          <p className="mt-2.5 rounded-[16px_16px_16px_4px] bg-pen-mist px-3.5 py-3 text-[13.5px] leading-normal">
            Салом, {firstName}!
            {businessName && (
              <>
                {" "}
                Аз <b>{businessName}</b>.
              </>
            )}{" "}
            Қарзи шумо <b>{amount}</b> аст. Агар имкон бошад, то охири ҳафта
            баргардонед. Ташаккур!
          </p>
          <div className="mt-2.5 flex gap-2">
            <a href={`https://t.me/share/url?url=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className={cn(buttonClass, "h-[38px]")}>
              Telegram
            </a>
            {phone.ok ? (
              <a href={smsHref(phone.phone, message)} className={cn(buttonClass, "h-[38px]")}>
                SMS
              </a>
            ) : (
              <button type="button" onClick={() => setPhoneNotice({ customerId: customer.id, where: "sms" })} className={cn(buttonClass, "h-[38px]")}>
                SMS
              </button>
            )}
          </div>
          {noticeAt("sms") && (
            <HandNote tone="red" role="alert" className="mt-2 block text-xl leading-tight">
              {phoneProblem}
            </HandNote>
          )}
        </div>
      )}
    </section>
  );
}
