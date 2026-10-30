import { formatMoney } from "@/lib/format";

const TJ_COUNTRY = "992";
const TJ_NATIONAL_DIGITS = 9;
const SEPARATORS = /[\s()-]/g;
const INTERNATIONAL = /^\+[1-9]\d{7,14}$/;

export type PhoneCheck = { ok: true; phone: string } | { ok: false; reason: "missing" | "invalid" };

export function normalizePhone(raw: string | null | undefined): PhoneCheck {
  const compact = (raw ?? "").trim().replace(SEPARATORS, "");
  if (!compact) return { ok: false, reason: "missing" };
  const plus = compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
  if (/^\d+$/.test(plus)) {
    if (plus.length === TJ_NATIONAL_DIGITS) return { ok: true, phone: `+${TJ_COUNTRY}${plus}` };
    if (plus.length === TJ_COUNTRY.length + TJ_NATIONAL_DIGITS && plus.startsWith(TJ_COUNTRY)) return { ok: true, phone: `+${plus}` };
    return { ok: false, reason: "invalid" };
  }
  if (plus.startsWith(`+${TJ_COUNTRY}`)) {
    return plus.length === 1 + TJ_COUNTRY.length + TJ_NATIONAL_DIGITS && /^\+\d+$/.test(plus) ? { ok: true, phone: plus } : { ok: false, reason: "invalid" };
  }
  return INTERNATIONAL.test(plus) ? { ok: true, phone: plus } : { ok: false, reason: "invalid" };
}

export function phoneProblemText(reason: "missing" | "invalid"): string {
  return reason === "missing"
    ? "Рақами телефони ин муштарӣ сабт нашудааст."
    : "Рақами телефони ин муштарӣ нодуруст аст. Онро санҷед, масалан +992 90 123 45 67.";
}

export function telHref(phone: string): string {
  return `tel:${phone}`;
}

export function smsHref(phone: string, body: string): string {
  return `sms:${phone}?&body=${encodeURIComponent(body)}`;
}

export function reminderText({ name, businessName, balance }: { name: string; businessName: string | null; balance: number }): string {
  const firstName = name.trim().split(/\s+/)[0] ?? "";
  const from = businessName ? ` Аз ${businessName}.` : "";
  const amount = `${formatMoney(balance, { unit: false })} сомонӣ`;
  return `Салом, ${firstName}!${from} Қарзи шумо ${amount} аст. Агар имкон бошад, то охири ҳафта баргардонед. Ташаккур!`;
}
