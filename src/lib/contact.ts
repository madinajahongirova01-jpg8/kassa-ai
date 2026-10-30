import { formatMoney } from "@/lib/format";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { createT } from "@/lib/i18n/translate";

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

export function phoneProblemText(reason: "missing" | "invalid", locale: Locale = DEFAULT_LOCALE): string {
  return createT(locale)(reason === "missing" ? "nasiya.phone.missing" : "nasiya.phone.invalid");
}

export function telHref(phone: string): string {
  return `tel:${phone}`;
}

export function smsHref(phone: string, body: string): string {
  return `sms:${phone}?&body=${encodeURIComponent(body)}`;
}

/** The amount as the reminder writes it: "120.50 сомонӣ". */
export function reminderAmount(balance: number, locale: Locale = DEFAULT_LOCALE): string {
  return `${formatMoney(balance, { unit: false, locale })} ${createT(locale)("nasiya.currency")}`;
}

// The message the owner sends goes out in the language they chose; the preview on the sheet uses the same texts.
export function reminderText({
  name,
  businessName,
  balance,
  locale = DEFAULT_LOCALE,
}: {
  name: string;
  businessName: string | null;
  balance: number;
  locale?: Locale;
}): string {
  const t = createT(locale);
  const firstName = name.trim().split(/\s+/)[0] ?? "";
  const from = businessName ? ` ${t("nasiya.reminder.fromBefore")}${businessName}${t("nasiya.reminder.fromAfter")}` : "";
  return `${t("nasiya.reminder.hello", { name: firstName })}${from} ${t("nasiya.reminder.debtBefore")}${reminderAmount(balance, locale)}${t("nasiya.reminder.debtAfter")}`;
}
