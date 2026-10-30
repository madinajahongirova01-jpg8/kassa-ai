import { patchJson, postJson, type PostResult } from "@/lib/api/client";
import type { ApiCustomer, ApiDebt } from "@/lib/api/types";
import { normalizePhone } from "@/lib/contact";
import { DIRAMS_PER_SOMONI, toApiAmount } from "@/lib/money";

export const MAX_CUSTOMER_NAME = 100;
export const MAX_DEBT_NOTE = 500;
export const MAX_DEBT_SOMONI = 10_000_000;
export const DEFAULT_DEBT_NOTE = "Насия";

const PHONE_PATTERN = /^\+?[0-9][0-9 ()-]{4,19}$/;
const WHOLE_SOMONI = /^\d+$/;
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type Post = <T>(url: string, body: unknown) => Promise<PostResult<T>>;

export type FormResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type CustomerForm = { name: string; phone: string };

export type DebtForm = { customerId: string; amount: string; note: string; dueOn: string };

export function customerNameError(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Номи муштариро нависед.";
  if (trimmed.length > MAX_CUSTOMER_NAME) return `Ном бояд то ${MAX_CUSTOMER_NAME} ҳарф бошад.`;
  return null;
}

export function customerPhoneError(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed || (PHONE_PATTERN.test(trimmed) && normalizePhone(trimmed).ok)) return null;
  return "Рақами телефонро дуруст нависед, масалан +992 90 123 45 67.";
}

export function somoniToDirams(somoni: number): number {
  if (!Number.isSafeInteger(somoni) || somoni <= 0) throw new RangeError("Somoni must be a positive integer");
  return somoni * DIRAMS_PER_SOMONI;
}

export function parseDebtAmount(text: string): { dirams: number } | { error: string } {
  const value = text.trim().replace(/\s/g, "");
  if (!value) return { error: "Маблағро нависед." };
  if (value.startsWith("-")) return { error: "Маблағ бояд аз сифр зиёд бошад." };
  if (/[.,]/.test(value)) return { error: "Маблағро бо сомонии бутун нависед, бе дирам." };
  if (!WHOLE_SOMONI.test(value)) return { error: "Маблағро бо рақам нависед." };
  const somoni = Number(value);
  if (somoni <= 0) return { error: "Маблағ бояд аз сифр зиёд бошад." };
  if (somoni > MAX_DEBT_SOMONI) return { error: `Маблағ набояд аз ${MAX_DEBT_SOMONI.toLocaleString("ru-RU")} сомонӣ зиёд бошад.` };
  return { dirams: somoniToDirams(somoni) };
}

export function debtNoteError(note: string): string | null {
  return note.trim().length > MAX_DEBT_NOTE ? `Шарҳ бояд то ${MAX_DEBT_NOTE} ҳарф бошад.` : null;
}

function isCalendarDate(value: string) {
  if (!CALENDAR_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function dueDateError(dueOn: string, today: string): string | null {
  if (!dueOn) return null;
  if (!isCalendarDate(dueOn)) return "Санаро дуруст интихоб кунед.";
  if (dueOn < today) return "Санаи баргардонидан набояд пеш аз имрӯз бошад.";
  return null;
}

export type CustomerErrors = Partial<Record<keyof CustomerForm, string>>;
export type DebtErrors = Partial<Record<keyof DebtForm, string>>;

export function validateCustomer(form: CustomerForm): CustomerErrors {
  const errors: CustomerErrors = {};
  const name = customerNameError(form.name);
  const phone = customerPhoneError(form.phone);
  if (name) errors.name = name;
  if (phone) errors.phone = phone;
  return errors;
}

export function validateDebt(form: DebtForm, customerIds: string[], today: string): DebtErrors {
  const errors: DebtErrors = {};
  if (!customerIds.includes(form.customerId)) errors.customerId = "Муштариро интихоб кунед.";
  const amount = parseDebtAmount(form.amount);
  if ("error" in amount) errors.amount = amount.error;
  const note = debtNoteError(form.note);
  if (note) errors.note = note;
  const due = dueDateError(form.dueOn, today);
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

function commonErrorText(status: number): string {
  if (status === 401) return "Вақти даромадан гузашт. Аз нав дароед.";
  if (status === 403) return "Дархост рад шуд. Саҳифаро нав кунед ва боз кӯшиш кунед.";
  if (status === 429) return "Кӯшишҳо зиёд шуданд. Каме сабр кунед ва боз кӯшиш кунед.";
  return "Сервер ҳоло ҷавоб намедиҳад. Сабт нигоҳ дошта нашуд, боз кӯшиш кунед.";
}

export function customerErrorText(status: number): string {
  if (status === 400) return "Маълумоти муштариро санҷед: ном ҳатмист, телефон — бо рақамҳо.";
  if (status === 404) return "Ин муштарӣ ёфт нашуд. Саҳифаро нав кунед.";
  return commonErrorText(status);
}

export function debtErrorText(status: number): string {
  if (status === 400) return "Маълумоти қарзро санҷед: маблағ, шарҳ ва сана.";
  if (status === 404) return "Ин муштарӣ ёфт нашуд. Саҳифаро нав кунед.";
  return commonErrorText(status);
}

export async function createCustomer(form: CustomerForm, post: Post = postJson): Promise<FormResult<ApiCustomer>> {
  const errors = validateCustomer(form);
  const first = errors.name ?? errors.phone;
  if (first) return { ok: false, error: first };
  const result = await post<ApiCustomer>("/api/customers", toCustomerPayload(form));
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: customerErrorText(result.status) };
}

export async function updateCustomer(customerId: string, form: CustomerForm, patch: Post = patchJson): Promise<FormResult<ApiCustomer>> {
  const errors = validateCustomer(form);
  const first = errors.name ?? errors.phone;
  if (first) return { ok: false, error: first };
  const result = await patch<ApiCustomer>(`/api/customers/${encodeURIComponent(customerId)}`, toCustomerUpdatePayload(form));
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: customerErrorText(result.status) };
}

export async function createDebt(form: DebtForm, customerIds: string[], today: string, post: Post = postJson): Promise<FormResult<ApiDebt>> {
  const errors = validateDebt(form, customerIds, today);
  const first = errors.customerId ?? errors.amount ?? errors.note ?? errors.dueOn;
  if (first) return { ok: false, error: first };
  const amount = parseDebtAmount(form.amount);
  if ("error" in amount) return { ok: false, error: amount.error };
  const result = await post<ApiDebt>(`/api/customers/${encodeURIComponent(form.customerId)}/debts`, toDebtPayload(form, amount.dirams, today));
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: debtErrorText(result.status) };
}
