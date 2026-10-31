"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type Ref } from "react";
import { HandNote } from "@/components/daftar/HandNote";
import { useLocale, usePlural, useT } from "@/components/i18n/I18nProvider";
import { NasiyaSheetEditor } from "@/components/nasiya/NasiyaSheetEditor";
import { PaymentForm } from "@/components/nasiya/PaymentForm";
import { cn } from "@/lib/cn";
import { normalizePhone, phoneProblemText, reminderAmount, reminderText, smsHref, telHref } from "@/lib/contact";
import { dayMonth, historyNote, lastPayment, type DebtRow } from "@/lib/debts";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import type { Plural, Translate } from "@/lib/i18n/translate";

type LineText = { t: Translate; plural: Plural; locale: Locale };

function dueLine(row: DebtRow, today: string, { t, plural, locale }: LineText): { tone: "pen" | "red" | "green"; text: string } {
  const due = row.customer.dueDate;
  if (row.status === "paid") {
    const payment = lastPayment(row);
    return { tone: "green", text: payment ? t("nasiya.sheet.paidInFull", { date: dayMonth(payment.date, today, locale) }) : t("nasiya.sticker.noDebt") };
  }
  if (!due || row.daysLeft === null) return { tone: "pen", text: t("nasiya.sticker.noDue") };
  const days = row.daysLeft;
  const date = dayMonth(due, today, locale);
  if (days < 0) return { tone: "red", text: plural("nasiya.sheet.overdue", Math.abs(days), { date }) };
  if (days === 0) return { tone: "pen", text: t("nasiya.sticker.dueToday") };
  if (days === 1) return { tone: "pen", text: t("nasiya.sheet.dueTomorrow", { date }) };
  return { tone: "pen", text: plural("nasiya.sheet.daysLeft", days, { date }) };
}

const buttonClass = "flex flex-1 items-center justify-center rounded-xl border-[1.5px] border-ink bg-card px-2 text-sm font-semibold whitespace-nowrap text-ink hover:text-pen";

type NasiyaSheetProps = {
  row: DebtRow;
  today: string;
  businessName: string | null;
  editing: boolean;
  onEdit: () => void;
  onEditClose: () => void;
  onEditSaved: () => void;
  ref?: Ref<HTMLElement>;
};

export function NasiyaSheet({ row, today, businessName, editing, onEdit, onEditClose, onEditSaved, ref }: NasiyaSheetProps) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paidId, setPaidId] = useState<string | null>(null);
  const [phoneNotice, setPhoneNotice] = useState<{ customerId: string; where: "call" | "sms" } | null>(null);
  const t = useT();
  const plural = usePlural();
  const locale = useLocale();
  const { customer, balance, status, history } = row;
  const paid = status === "paid";
  const overdue = status === "overdue";
  const line = dueLine(row, today, { t, plural, locale });
  const firstName = customer.name.trim().split(/\s+/)[0];
  const amount = reminderAmount(balance, locale);
  const message = reminderText({ name: customer.name, businessName, balance, locale });
  const phone = normalizePhone(customer.phone);
  const phoneProblem = phone.ok ? null : phoneProblemText(phone.reason, locale);
  const noticeAt = (where: "call" | "sms") => phoneProblem !== null && phoneNotice?.customerId === customer.id && phoneNotice.where === where;

  const paying = payingId === customer.id;

  function openPayment() {
    setPaidId(null);
    setPayingId(customer.id);
  }

  function paymentSaved() {
    setPayingId(null);
    setPaidId(customer.id);
    startRefresh(() => router.refresh());
  }

  return (
    <section
      ref={ref}
      aria-label={t("nasiya.sheet.label", { name: customer.name })}
      className="relative flex scroll-mt-4 flex-col gap-3.5 rounded-sheet border-[1.5px] border-ink bg-card bg-[linear-gradient(90deg,transparent_30px,var(--color-margin)_30px,var(--color-margin)_31.5px,transparent_31.5px)] py-[22px] pr-[18px] pb-[18px] pl-11 shadow-hard-xl lg:min-h-0 lg:overflow-y-auto lg:pr-[22px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[19px] font-bold">{customer.name}</h2>
          <div className="mt-0.5 text-[13px] text-ink-2">
            {customer.phone}
            {customer.note && ` · ${customer.note}`}
          </div>
          {!editing && (
            <button
              type="button"
              onClick={onEdit}
              className="mt-1 text-sm font-semibold text-ink-2 hover:text-pen print:hidden"
            >
              {t("nasiya.sheet.edit")}
            </button>
          )}
        </div>
        <div className="text-right">
          <div className={cn("font-display text-[30px] leading-tight font-extrabold", overdue && "text-red", paid && "text-green")}>
            {formatMoney(balance, { unit: false, locale })}
          </div>
          <div className="text-[11px] text-ink-2">{t("nasiya.currency")}</div>
        </div>
      </div>

      <HandNote tone={line.tone} className="text-[23px] leading-tight">
        {line.text}
      </HandNote>

      {editing ? (
        <NasiyaSheetEditor key={customer.id} customer={customer} history={history} today={today} onSaved={onEditSaved} onClose={onEditClose} />
      ) : (
        <>
          <ul className="flex flex-col font-mono text-[13px]">
            {history.map((event) => (
              <li key={event.id} className={cn("flex gap-3.5 border-b border-grid py-[9px]", event.cancelled && "text-ink-3")}>
                <span className="w-12 shrink-0 text-ink-3">{dayMonth(event.date, today, locale)}</span>
                <span className={cn("min-w-0 flex-1", event.cancelled && "line-through")}>
                  {historyNote(event, locale)}
                  {event.type === "payment" && event.method && <span className="text-ink-3"> · {t(`nasiya.methods.${event.method}`)}</span>}
                </span>
                {event.cancelled && <span className="shrink-0 font-sans text-xs font-semibold text-red">{t("nasiya.edit.cancelled")}</span>}
                <span className={cn("font-bold", event.cancelled ? "line-through" : event.type === "payment" && "text-green")}>{formatMoney(event.amount, { unit: false, locale })}</span>
              </li>
            ))}
            <li className="flex gap-3.5 border-b-[1.5px] border-ink py-[9px]">
              <span className="w-12 shrink-0 text-ink-3">{t("nasiya.today")}</span>
              <span className="flex-1 font-bold">{t("nasiya.sheet.balance")}</span>
              <span className={cn("font-bold", overdue && "text-red", paid && "text-green")}>{formatMoney(balance, { unit: false, locale })}</span>
            </li>
          </ul>

          <div className="flex gap-2.5">
            <button
              type="button"
              disabled={paid || paying || refreshing}
              onClick={openPayment}
              aria-expanded={paying}
              className="h-[46px] flex-1 rounded-tile border-[1.5px] border-ink bg-pen px-2 text-sm font-bold whitespace-nowrap text-card shadow-hard-sm active:translate-x-px active:translate-y-px active:shadow-none disabled:border-line-strong disabled:bg-line disabled:text-ink-3 disabled:shadow-none"
            >
              {refreshing ? t("nasiya.saving") : t("nasiya.payment.title")}
            </button>
            {phone.ok ? (
              <a href={telHref(phone.phone)} className={cn(buttonClass, "h-[46px] rounded-tile")}>
                {t("nasiya.sheet.call")}
              </a>
            ) : (
              <button type="button" onClick={() => setPhoneNotice({ customerId: customer.id, where: "call" })} className={cn(buttonClass, "h-[46px] rounded-tile")}>
                {t("nasiya.sheet.call")}
              </button>
            )}
          </div>
          {noticeAt("call") && (
            <HandNote tone="red" role="alert" className="text-xl leading-tight">
              {phoneProblem}
            </HandNote>
          )}
          {paying && !paid && (
            <PaymentForm key={customer.id} customerId={customer.id} balance={balance} onPaid={paymentSaved} onCancel={() => setPayingId(null)} />
          )}
          {paidId === customer.id && !refreshing && (
            <HandNote tone="green" role="status" className="text-xl leading-tight">
              {t("nasiya.payment.saved")}
            </HandNote>
          )}

          {!paid && (
            <div className="mt-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold">{t("nasiya.sheet.reminderTitle")}</span>
                <HandNote className="text-xl">{t("nasiya.sheet.reminderNote")}</HandNote>
              </div>
              <p className="mt-2.5 rounded-[16px_16px_16px_4px] bg-pen-mist px-3.5 py-3 text-[13.5px] leading-normal">
                {t("nasiya.reminder.hello", { name: firstName })}
                {businessName && (
                  <>
                    {" "}
                    {t("nasiya.reminder.fromBefore")}
                    <b>{businessName}</b>
                    {t("nasiya.reminder.fromAfter")}
                  </>
                )}{" "}
                {t("nasiya.reminder.debtBefore")}
                <b>{amount}</b>
                {t("nasiya.reminder.debtAfter")}
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
        </>
      )}
    </section>
  );
}
