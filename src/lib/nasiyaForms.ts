import { patchJson, postJson, requestErrorText, type PostResult } from "@/lib/api/client";
import type { ApiCustomer, ApiDebt } from "@/lib/api/types";
import { normalizePhone } from "@/lib/contact";
import { formatMoney, formatNumber } from "@/lib/format";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { createT } from "@/lib/i18n/translate";
import { DIRAMS_PER_SOMONI, parseSomoniInput, toApiAmount } from "@/lib/money";

export const MAX_CUSTOMER_NAME = 100;
export const MAX_DEBT_NOTE = 500;
export const MAX_DEBT_SOMONI = 10_000_000;
// Saved as the description when the owner leaves it empty; the history shows it as a translated label.
export const DEFAULT_DEBT_NOTE = "Насия";

const PHONE_PATTERN = /^\+?[0-9][0-9 ()-]{4,19}$/;
const WHOLE_SOMONI = /^\d+$/;
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type Post = <T>(url: string, body: unknown) => Promise<PostResult<T>>;

export type FormResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type CustomerForm = { name: string; phone: string };

export type DebtForm = { customerId: string; amount: string; note: string; dueOn: string };

export function customerNameError(name: string, locale: Locale = DEFAULT_LOCALE): string | null {
  const t = createT(locale);
  const trimmed = name.trim();
  if (!trimmed) return t("nasiya.validation.nameRequired");
  if (trimmed.length > MAX_CUSTOMER_NAME) return t("nasiya.validation.nameTooLong", { max: MAX_CUSTOMER_NAME });
  return null;
}

export function customerPhoneError(phone: string, locale: Locale = DEFAULT_LOCALE): string | null {
  const trimmed = phone.trim();
  if (!trimmed || (PHONE_PATTERN.test(trimmed) && normalizePhone(trimmed).ok)) return null;
  return createT(locale)("nasiya.validation.phoneInvalid");
}

export function somoniToDirams(somoni: number): number {
  if (!Number.isSafeInteger(somoni) || somoni <= 0) throw new RangeError("Somoni must be a positive integer");
  return somoni * DIRAMS_PER_SOMONI;
}

export function parseDebtAmount(text: string, locale: Locale = DEFAULT_LOCALE): { dirams: number } | { error: string } {
  const t = createT(locale);
  const value = text.trim().replace(/\s/g, "");
  if (!value) return { error: t("nasiya.validation.amountRequired") };
  if (value.startsWith("-")) return { error: t("nasiya.validation.amountPositive") };
  if (/[.,]/.test(value)) return { error: t("nasiya.validation.amountWhole") };
  if (!WHOLE_SOMONI.test(value)) return { error: t("nasiya.validation.amountDigits") };
  const somoni = Number(value);
  if (somoni <= 0) return { error: t("nasiya.validation.amountPositive") };
  if (somoni > MAX_DEBT_SOMONI) return { error: t("nasiya.validation.amountMax", { max: formatNumber(MAX_DEBT_SOMONI, 0, locale) }) };
  return { dirams: somoniToDirams(somoni) };
}

export function debtNoteError(note: string, locale: Locale = DEFAULT_LOCALE): string | null {
  return note.trim().length > MAX_DEBT_NOTE ? createT(locale)("nasiya.validation.noteTooLong", { max: MAX_DEBT_NOTE }) : null;
}

function isCalendarDate(value: string) {
  if (!CALENDAR_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function dueDateError(dueOn: string, today: string, locale: Locale = DEFAULT_LOCALE): string | null {
  if (!dueOn) return null;
  if (!isCalendarDate(dueOn)) return createT(locale)("nasiya.validation.dateInvalid");
  if (dueOn < today) return createT(locale)("nasiya.validation.datePast");
  return null;
}

export type CustomerErrors = Partial<Record<keyof CustomerForm, string>>;
export type DebtErrors = Partial<Record<keyof DebtForm, string>>;

export function validateCustomer(form: CustomerForm, locale: Locale = DEFAULT_LOCALE): CustomerErrors {
  const errors: CustomerErrors = {};
  const name = customerNameError(form.name, locale);
  const phone = customerPhoneError(form.phone, locale);
  if (name) errors.name = name;
  if (phone) errors.phone = phone;
  return errors;
}

export function validateDebt(form: DebtForm, customerIds: string[], today: string, locale: Locale = DEFAULT_LOCALE): DebtErrors {
  const errors: DebtErrors = {};
  if (!customerIds.includes(form.customerId)) errors.customerId = createT(locale)("nasiya.validation.customerRequired");
  const amount = parseDebtAmount(form.amount, locale);
  if ("error" in amount) errors.amount = amount.error;
  const note = debtNoteError(form.note, locale);
  if (note) errors.note = note;
  const due = dueDateError(form.dueOn, today, locale);
  if (due) errors.dueOn = due;
  return errors;
}

export function toCustomerPayload(form: CustomerForm) {
  const phone = form.phone.trim();
  return phone ? { name: form.name.trim(), phone } : { name: form.name.trim() };
}

// An empty phone on edit means "remove it", which the API expects as null.
export function toCustomerUpdatePayload(form: CustomerForm) {
  return { name: form.name.trim(), phone: form.phone.trim() || null };
}

export function toDebtPayload(form: DebtForm, dirams: number, today: string) {
  const payload = {
    amount: toApiAmount(dirams),
    description: form.note.trim() || DEFAULT_DEBT_NOTE,
    occurredOn: today,
  };
  return form.dueOn ? { ...payload, dueOn: form.dueOn } : payload;
}

function commonErrorText(status: number, locale: Locale): string {
  const t = createT(locale);
  if (status === 401) return t("nasiya.errors.session");
  if (status === 403) return t("nasiya.errors.forbidden");
  if (status === 429) return t("nasiya.errors.tooMany");
  return t("nasiya.errors.notSaved");
}

export function customerErrorText(status: number, locale: Locale = DEFAULT_LOCALE): string {
  if (status === 400) return createT(locale)("nasiya.errors.customerInvalid");
  if (status === 404) return createT(locale)("nasiya.errors.customerNotFound");
  return commonErrorText(status, locale);
}

export function debtErrorText(status: number, locale: Locale = DEFAULT_LOCALE): string {
  if (status === 400) return createT(locale)("nasiya.errors.debtInvalid");
  if (status === 404) return createT(locale)("nasiya.errors.customerNotFound");
  return commonErrorText(status, locale);
}

export async function createCustomer(form: CustomerForm, post: Post = postJson, locale: Locale = DEFAULT_LOCALE): Promise<FormResult<ApiCustomer>> {
  const errors = validateCustomer(form, locale);
  const first = errors.name ?? errors.phone;
  if (first) return { ok: false, error: first };
  const result = await post<ApiCustomer>("/api/customers", toCustomerPayload(form));
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: customerErrorText(result.status, locale) };
}

export async function updateCustomer(
  customerId: string,
  form: CustomerForm,
  patch: Post = patchJson,
  locale: Locale = DEFAULT_LOCALE,
): Promise<FormResult<ApiCustomer>> {
  const errors = validateCustomer(form, locale);
  const first = errors.name ?? errors.phone;
  if (first) return { ok: false, error: first };
  const result = await patch<ApiCustomer>(`/api/customers/${encodeURIComponent(customerId)}`, toCustomerUpdatePayload(form));
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: customerErrorText(result.status, locale) };
}

export async function createDebt(
  form: DebtForm,
  customerIds: string[],
  today: string,
  post: Post = postJson,
  locale: Locale = DEFAULT_LOCALE,
): Promise<FormResult<ApiDebt>> {
  const errors = validateDebt(form, customerIds, today, locale);
  const first = errors.customerId ?? errors.amount ?? errors.note ?? errors.dueOn;
  if (first) return { ok: false, error: first };
  const amount = parseDebtAmount(form.amount, locale);
  if ("error" in amount) return { ok: false, error: amount.error };
  const result = await post<ApiDebt>(`/api/customers/${encodeURIComponent(form.customerId)}/debts`, toDebtPayload(form, amount.dirams, today));
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: debtErrorText(result.status, locale) };
}

export function paymentInputValue(dirams: number): string {
  const whole = Math.floor(dirams / DIRAMS_PER_SOMONI);
  const fraction = dirams % DIRAMS_PER_SOMONI;
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, "0")}`;
}

export function parsePaymentAmount(text: string, balance: number, locale: Locale = DEFAULT_LOCALE): { dirams: number } | { error: string } {
  const t = createT(locale);
  const value = text.trim().replace(/\s/g, "");
  if (!value) return { error: t("nasiya.payment.errors.required") };
  if (value.startsWith("-")) return { error: t("nasiya.payment.errors.positive") };
  const dirams = parseSomoniInput(value);
  if (dirams === null) return { error: t("nasiya.payment.errors.invalid") };
  if (dirams <= 0) return { error: t("nasiya.payment.errors.positive") };
  if (dirams > balance) return { error: t("nasiya.payment.errors.tooMuch", { max: formatMoney(balance, { unit: false, locale }) }) };
  return { dirams };
}

export async function acceptPayment(
  customerId: string,
  text: string,
  balance: number,
  post: Post = postJson,
  locale: Locale = DEFAULT_LOCALE,
): Promise<FormResult<unknown>> {
  const amount = parsePaymentAmount(text, balance, locale);
  if ("error" in amount) return { ok: false, error: amount.error };
  const result = await post<unknown>(`/api/customers/${encodeURIComponent(customerId)}/payments`, { amount: toApiAmount(amount.dirams) });
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: requestErrorText(result.status, result.details, locale) };
}
