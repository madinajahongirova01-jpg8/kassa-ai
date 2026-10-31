"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { HandNote } from "@/components/daftar/HandNote";
import { useLocale, useT } from "@/components/i18n/I18nProvider";
import { Field, fieldClass, useSubmitGuard } from "@/components/nasiya/NasiyaForms";
import type { DebtCustomer, DebtEvent } from "@/data/debts";
import { patchJson, postJson } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { dayMonth, historyNote } from "@/lib/debts";
import { formatMoney } from "@/lib/format";
import { cancelPayment, debtChanges, debtDraftErrors, debtDraftOf, saveDebtChanges, type DebtDraft, type DebtDraftErrors } from "@/lib/nasiyaEdit";
import { MAX_CUSTOMER_NAME, MAX_DEBT_NOTE, updateCustomer, validateCustomer, type CustomerErrors } from "@/lib/nasiyaForms";

const smallField = "h-10 w-full min-w-0 rounded-xl border-[1.5px] border-ink bg-card px-2.5 text-sm text-ink outline-none placeholder:text-ink-3 focus:border-pen aria-invalid:border-red";
const textButton = "text-sm font-semibold text-ink-2 hover:text-pen disabled:text-ink-3";

type NasiyaSheetEditorProps = {
  customer: DebtCustomer;
  history: DebtEvent[];
  today: string;
  onSaved: () => void;
  onClose: () => void;
};

export function NasiyaSheetEditor({ customer, history, today, onSaved, onClose }: NasiyaSheetEditorProps) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const [refreshing, startRefresh] = useTransition();
  const { pending, run } = useSubmitGuard();
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [customerErrors, setCustomerErrors] = useState<CustomerErrors>({});
  const [drafts, setDrafts] = useState<Record<string, DebtDraft>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, DebtDraftErrors>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const busy = pending || refreshing;
  const debts = history.filter((event) => event.type === "debt");

  const draftOf = (debt: DebtEvent) => drafts[debt.id] ?? debtDraftOf(debt);

  function changeDraft(debt: DebtEvent, field: keyof DebtDraft, value: string) {
    setDrafts((current) => ({ ...current, [debt.id]: { ...(current[debt.id] ?? debtDraftOf(debt)), [field]: value } }));
  }

  function refresh() {
    startRefresh(() => router.refresh());
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const foundCustomer = validateCustomer({ name, phone }, locale);
    const foundRows: Record<string, DebtDraftErrors> = {};
    for (const debt of debts) {
      if (!drafts[debt.id]) continue;
      const found = debtDraftErrors(drafts[debt.id], debt, locale);
      if (Object.keys(found).length > 0) foundRows[debt.id] = found;
    }
    setCustomerErrors(foundCustomer);
    setRowErrors(foundRows);
    if (foundCustomer.name || foundCustomer.phone || Object.keys(foundRows).length > 0) return;

    const customerChanged = name.trim() !== customer.name || phone.trim() !== customer.phone;
    const changedDebts = debts.flatMap((debt) => {
      const changes = drafts[debt.id] ? debtChanges(drafts[debt.id], debt) : null;
      return changes ? [{ debt, changes }] : [];
    });
    if (!customerChanged && changedDebts.length === 0) {
      onClose();
      return;
    }

    void run(async () => {
      if (customerChanged) {
        const result = await updateCustomer(customer.id, { name, phone }, patchJson, locale);
        if (!result.ok) {
          setError(result.error);
          return;
        }
      }
      for (const { debt, changes } of changedDebts) {
        const result = await saveDebtChanges(debt.id, changes, patchJson, locale);
        if (!result.ok) {
          setRowErrors({ [debt.id]: { amount: result.error } });
          refresh();
          return;
        }
      }
      onSaved();
    });
  }

  function confirmCancel(payment: DebtEvent) {
    setError(null);
    setNotice(null);
    void run(async () => {
      const result = await cancelPayment(payment.id, postJson, locale);
      setConfirmingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotice(t("nasiya.edit.paymentCancelled"));
      refresh();
    });
  }

  return (
    <form noValidate onSubmit={submit} aria-label={t("nasiya.forms.editCustomer")} className="flex flex-col gap-3.5 print:hidden">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id={`edit-${customer.id}-name`} label={t("nasiya.forms.customerName")} error={customerErrors.name}>
          <input
            id={`edit-${customer.id}-name`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            readOnly={busy}
            maxLength={MAX_CUSTOMER_NAME}
            autoComplete="off"
            aria-invalid={Boolean(customerErrors.name)}
            aria-describedby={customerErrors.name ? `edit-${customer.id}-name-error` : undefined}
            className={fieldClass}
          />
        </Field>
        <Field id={`edit-${customer.id}-phone`} label={t("nasiya.forms.phone")} hint={t("nasiya.forms.optional")} error={customerErrors.phone}>
          <input
            id={`edit-${customer.id}-phone`}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            readOnly={busy}
            placeholder="+992 90 123 45 67"
            autoComplete="off"
            aria-invalid={Boolean(customerErrors.phone)}
            aria-describedby={customerErrors.phone ? `edit-${customer.id}-phone-error` : undefined}
            className={fieldClass}
          />
        </Field>
      </div>

      <ul className="flex flex-col font-mono text-[13px]">
        {history.map((event) =>
          event.type === "debt" ? (
            <DebtRowEditor
              key={event.id}
              debt={event}
              draft={draftOf(event)}
              errors={rowErrors[event.id] ?? {}}
              today={today}
              busy={busy}
              onChange={(field, value) => changeDraft(event, field, value)}
            />
          ) : (
            <li key={event.id} className="flex flex-col gap-1.5 border-b border-grid py-[9px]">
              <div className={cn("flex gap-3.5", event.cancelled && "text-ink-3")}>
                <span className="w-12 shrink-0 text-ink-3">{dayMonth(event.date, today, locale)}</span>
                <span className={cn("min-w-0 flex-1", event.cancelled && "line-through")}>
                  {historyNote(event, locale)}
                  {event.method && <span className="text-ink-3"> · {t(`nasiya.methods.${event.method}`)}</span>}
                </span>
                <span className={cn("font-bold", event.cancelled ? "line-through" : "text-green")}>{formatMoney(event.amount, { unit: false, locale })}</span>
              </div>
              {event.cancelled ? (
                <span className="pl-[62px] font-sans text-xs font-semibold text-red">{t("nasiya.edit.cancelled")}</span>
              ) : confirmingId === event.id ? (
                <div role="alertdialog" aria-label={t("nasiya.edit.confirm")} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-[62px] font-sans">
                  <span className="text-sm font-semibold">{t("nasiya.edit.confirm")}</span>
                  <button type="button" onClick={() => confirmCancel(event)} disabled={busy} className="text-sm font-bold text-red disabled:text-ink-3">
                    {busy ? t("nasiya.saving") : t("nasiya.edit.confirmYes")}
                  </button>
                  <button type="button" onClick={() => setConfirmingId(null)} disabled={busy} className={textButton}>
                    {t("nasiya.edit.confirmNo")}
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmingId(event.id)} disabled={busy} className={cn(textButton, "self-start pl-[62px] font-sans text-xs")}>
                  {t("nasiya.edit.cancelPayment")}
                </button>
              )}
            </li>
          ),
        )}
      </ul>

      {error && (
        <HandNote tone="red" role="alert" className="text-xl leading-tight">
          {error}
        </HandNote>
      )}
      {notice && !refreshing && (
        <HandNote tone="green" role="status" className="text-xl leading-tight">
          {notice}
        </HandNote>
      )}
      <div className="flex gap-2.5">
        <button
          type="submit"
          disabled={busy}
          className="h-[46px] flex-1 rounded-tile border-[1.5px] border-ink bg-pen px-2 text-sm font-bold whitespace-nowrap text-card shadow-hard-sm active:translate-x-px active:translate-y-px active:shadow-none disabled:border-line-strong disabled:bg-line disabled:text-ink-3 disabled:shadow-none"
        >
          {busy ? t("nasiya.saving") : t("nasiya.edit.save")}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="h-[46px] flex-1 rounded-tile border-[1.5px] border-ink bg-card px-2 text-sm font-semibold whitespace-nowrap text-ink hover:text-pen disabled:text-ink-3"
        >
          {t("nasiya.edit.cancel")}
        </button>
      </div>
    </form>
  );
}

type DebtRowEditorProps = {
  debt: DebtEvent;
  draft: DebtDraft;
  errors: DebtDraftErrors;
  today: string;
  busy: boolean;
  onChange: (field: keyof DebtDraft, value: string) => void;
};

function DebtRowEditor({ debt, draft, errors, today, busy, onChange }: DebtRowEditorProps) {
  const t = useT();
  const locale = useLocale();
  const id = `edit-debt-${debt.id}`;
  const paid = debt.paid ?? 0;
  const messages = [errors.amount, errors.note, errors.dueOn].filter(Boolean);

  return (
    <li className="flex flex-col gap-1.5 border-b border-grid py-[9px]">
      <div className="flex items-center gap-3.5">
        <span className="w-12 shrink-0 text-ink-3">{dayMonth(debt.date, today, locale)}</span>
        <label htmlFor={`${id}-note`} className="sr-only">
          {t("nasiya.forms.note")}
        </label>
        <input
          id={`${id}-note`}
          value={draft.note}
          onChange={(event) => onChange("note", event.target.value)}
          readOnly={busy}
          maxLength={MAX_DEBT_NOTE}
          placeholder={t("nasiya.history.debt")}
          autoComplete="off"
          aria-invalid={Boolean(errors.note)}
          className={cn(smallField, "flex-1 font-sans")}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 pl-[62px] font-sans">
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor={`${id}-amount`} className="text-xs font-semibold text-ink-2">
            {t("nasiya.forms.amount")}
          </label>
          <input
            id={`${id}-amount`}
            inputMode="decimal"
            value={draft.amount}
            onChange={(event) => onChange("amount", event.target.value)}
            readOnly={busy}
            autoComplete="off"
            aria-invalid={Boolean(errors.amount)}
            className={smallField}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor={`${id}-due`} className="text-xs font-semibold text-ink-2">
            {t("nasiya.edit.due")}
          </label>
          <input
            id={`${id}-due`}
            type="date"
            value={draft.dueOn}
            min={debt.date}
            onChange={(event) => onChange("dueOn", event.target.value)}
            readOnly={busy}
            aria-invalid={Boolean(errors.dueOn)}
            className={cn(smallField, "px-1.5")}
          />
        </div>
      </div>
      {paid > 0 && <span className="pl-[62px] font-sans text-xs text-ink-3">{t("nasiya.edit.paid", { amount: formatMoney(paid, { unit: false, locale }) })}</span>}
      {messages.map((message) => (
        <p key={message} role="alert" className="pl-[62px] font-sans text-sm font-medium text-red">
          {message}
        </p>
      ))}
    </li>
  );
}
