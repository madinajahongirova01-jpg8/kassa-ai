"use client";

import type { Ref } from "react";
import { HandNote } from "@/components/daftar/HandNote";
import { currentBusiness } from "@/data/business";
import { cn } from "@/lib/cn";
import { dayMonth, daysUntil, lastPayment, type DebtRow } from "@/lib/debts";
import { recordFullRepayment } from "@/lib/debtStore";
import { formatSomoni } from "@/lib/format";

function dueLine(row: DebtRow): { tone: "pen" | "red" | "green"; text: string } {
  const due = row.customer.dueDate;
  if (row.status === "paid" || !due) {
    const payment = lastPayment(row);
    return { tone: "green", text: payment ? `${dayMonth(payment.date)} пурра баргардонд — раҳмат!` : "қарз нест" };
  }
  const days = daysUntil(due);
  if (days < 0) return { tone: "red", text: `мӯҳлат ${dayMonth(due)} буд — ${Math.abs(days)} рӯз гузашт` };
  if (days === 0) return { tone: "pen", text: "мӯҳлат — имрӯз" };
  if (days === 1) return { tone: "pen", text: `мӯҳлат — фардо, ${dayMonth(due)}` };
  return { tone: "pen", text: `мӯҳлат то ${dayMonth(due)} — ${days} рӯз монд` };
}

const buttonClass = "flex flex-1 items-center justify-center rounded-xl border-[1.5px] border-ink bg-card px-2 text-sm font-semibold whitespace-nowrap text-ink hover:text-pen";

export function NasiyaSheet({ row, ref }: { row: DebtRow; ref?: Ref<HTMLElement> }) {
  const { customer, balance, status, history } = row;
  const paid = status === "paid";
  const overdue = status === "overdue";
  const line = dueLine(row);
  const firstName = customer.name.split(" ")[0];
  const amount = `${formatSomoni(balance, { unit: false })} сомонӣ`;
  const message = `Салом, ${firstName}! Аз ${currentBusiness.shortName}. Қарзи шумо ${amount} аст. Агар имкон бошад, то охири ҳафта баргардонед. Ташаккур!`;
  const phone = customer.phone.replace(/\s/g, "");

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
        </div>
        <div className="text-right">
          <div className={cn("font-display text-[30px] leading-tight font-extrabold", overdue && "text-red", paid && "text-green")}>
            {formatSomoni(balance, { unit: false })}
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
            <span className="w-12 shrink-0 text-ink-3">{dayMonth(event.date)}</span>
            <span className="min-w-0 flex-1">{event.note}</span>
            <span className={cn("font-bold", event.type === "payment" && "text-green")}>{formatSomoni(event.amount, { unit: false })}</span>
          </li>
        ))}
        <li className="flex gap-3.5 border-b-[1.5px] border-ink py-[9px]">
          <span className="w-12 shrink-0 text-ink-3">имрӯз</span>
          <span className="flex-1 font-bold">Боқимонда</span>
          <span className={cn("font-bold", overdue && "text-red", paid && "text-green")}>{formatSomoni(balance, { unit: false })}</span>
        </li>
      </ul>

      <div className="flex gap-2.5">
        <button
          type="button"
          disabled={paid}
          onClick={() => recordFullRepayment(customer.id)}
          className="h-[46px] flex-1 rounded-tile border-[1.5px] border-ink bg-pen px-2 text-sm font-bold whitespace-nowrap text-card shadow-hard-sm active:translate-x-px active:translate-y-px active:shadow-none disabled:border-line-strong disabled:bg-line disabled:text-ink-3 disabled:shadow-none"
        >
          Пардохт қабул шуд
        </button>
        <a href={`tel:${phone}`} className={cn(buttonClass, "h-[46px] rounded-tile")}>
          Занг задан
        </a>
      </div>

      {!paid && (
        <div className="mt-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-bold">Ёдраскунии мулоим</span>
            <HandNote className="text-xl">бе хиҷолат :)</HandNote>
          </div>
          <p className="mt-2.5 rounded-[16px_16px_16px_4px] bg-pen-mist px-3.5 py-3 text-[13.5px] leading-normal">
            Салом, {firstName}! Аз <b>{currentBusiness.shortName}</b>. Қарзи шумо <b>{amount}</b> аст. Агар имкон бошад, то охири ҳафта
            баргардонед. Ташаккур!
          </p>
          <div className="mt-2.5 flex gap-2">
            <a href={`https://t.me/share/url?url=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className={cn(buttonClass, "h-[38px]")}>
              Telegram
            </a>
            <a href={`sms:${phone}?body=${encodeURIComponent(message)}`} className={cn(buttonClass, "h-[38px]")}>
              SMS
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
