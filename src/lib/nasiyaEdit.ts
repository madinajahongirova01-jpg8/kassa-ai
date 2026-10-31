import type { DebtEvent } from "@/data/debts";
import { patchJson, postJson, requestErrorText } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { createT } from "@/lib/i18n/translate";
import { DIRAMS_PER_SOMONI, parseSomoniInput, toApiAmount, toDirams } from "@/lib/money";
import { DEFAULT_DEBT_NOTE, MAX_DEBT_NOTE, MAX_DEBT_SOMONI, debtErrorText, paymentInputValue, type FormResult, type Post } from "@/lib/nasiyaForms";

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;
const PAID_AMOUNT = /^paidAmount: (\d+\.\d{2})$/;
const MAX_DEBT_DIRAMS = MAX_DEBT_SOMONI * DIRAMS_PER_SOMONI;

export type DebtDraft = { amount: string; note: string; dueOn: string };
export type DebtDraftErrors = Partial<Record<keyof DebtDraft, string>>;
export type DebtChanges = { amount?: string; description?: string; dueOn?: string | null };

export function debtDraftOf(debt: DebtEvent): DebtDraft {
  return {
    amount: paymentInputValue(debt.amount),
    note: debt.note === DEFAULT_DEBT_NOTE ? "" : debt.note,
    dueOn: debt.dueOn ?? "",
  };
}

function isCalendarDate(value: string) {
  if (!CALENDAR_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseDebtEditAmount(text: string, paid: number, locale: Locale = DEFAULT_LOCALE): { dirams: number } | { error: string } {
  const t = createT(locale);
  const value = text.trim().replace(/\s/g, "");
  if (!value) return { error: t("nasiya.validation.amountRequired") };
  if (value.startsWith("-")) return { error: t("nasiya.validation.amountPositive") };
  const dirams = parseSomoniInput(value);
  if (dirams === null) return { error: t("nasiya.edit.errors.amountInvalid") };
  if (dirams <= 0) return { error: t("nasiya.validation.amountPositive") };
  if (dirams > MAX_DEBT_DIRAMS) return { error: t("nasiya.validation.amountMax", { max: formatMoney(MAX_DEBT_DIRAMS, { unit: false, locale }) }) };
  if (dirams < paid) return { error: t("nasiya.edit.errors.belowPaid", { paid: formatMoney(paid, { unit: false, locale }) }) };
  return { dirams };
}

export function debtDraftErrors(draft: DebtDraft, debt: DebtEvent, locale: Locale = DEFAULT_LOCALE): DebtDraftErrors {
  const t = createT(locale);
  const errors: DebtDraftErrors = {};
  const amount = parseDebtEditAmount(draft.amount, debt.paid ?? 0, locale);
  if ("error" in amount) errors.amount = amount.error;
  if (draft.note.trim().length > MAX_DEBT_NOTE) errors.note = t("nasiya.validation.noteTooLong", { max: MAX_DEBT_NOTE });
  if (draft.dueOn) {
    if (!isCalendarDate(draft.dueOn)) errors.dueOn = t("nasiya.validation.dateInvalid");
    else if (draft.dueOn < debt.date) errors.dueOn = t("nasiya.edit.errors.dueBeforeDebt");
  }
  return errors;
}

export function debtChanges(draft: DebtDraft, debt: DebtEvent): DebtChanges | null {
  const changes: DebtChanges = {};
  const dirams = parseSomoniInput(draft.amount.replace(/\s/g, ""));
  if (dirams !== null && dirams > 0 && dirams !== debt.amount) changes.amount = toApiAmount(dirams);
  const description = draft.note.trim() || DEFAULT_DEBT_NOTE;
  if (description !== debt.note) changes.description = description;
  const dueOn = draft.dueOn || null;
  if (dueOn !== (debt.dueOn ?? null)) changes.dueOn = dueOn;
  return Object.keys(changes).length > 0 ? changes : null;
}

export function debtEditErrorText(status: number, details: string[], locale: Locale = DEFAULT_LOCALE): string {
  const t = createT(locale);
  if (status === 422) {
    const paid = details.map((detail) => PAID_AMOUNT.exec(detail)?.[1]).find(Boolean);
    if (paid) return t("nasiya.edit.errors.belowPaid", { paid: formatMoney(toDirams(paid), { unit: false, locale }) });
  }
  if (status === 404) return t("nasiya.errors.recordNotFound");
  return debtErrorText(status, locale);
}

export async function saveDebtChanges(debtId: string, changes: DebtChanges, patch: Post = patchJson, locale: Locale = DEFAULT_LOCALE): Promise<FormResult<unknown>> {
  const result = await patch<unknown>(`/api/debts/${encodeURIComponent(debtId)}`, changes);
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: debtEditErrorText(result.status, result.details, locale) };
}

export async function cancelPayment(paymentId: string, post: Post = postJson, locale: Locale = DEFAULT_LOCALE): Promise<FormResult<unknown>> {
  const result = await post<unknown>(`/api/payments/${encodeURIComponent(paymentId)}/cancel`, {});
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: requestErrorText(result.status, result.details, locale) };
}
