export const LOCALES = ["tg", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "tg";

// Readable by browser JavaScript on purpose: the language switcher writes it directly.
export const LOCALE_COOKIE = "kassa_lang";
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// Each language is named in itself, so a user can find theirs whatever is selected now.
export const LOCALE_NAMES: Record<Locale, { flag: string; name: string }> = {
  tg: { flag: "🇹🇯", name: "Тоҷикӣ" },
  ru: { flag: "🇷🇺", name: "Русский" },
  en: { flag: "🇬🇧", name: "English" },
};

/** The option text in the language select: "🇹🇯 Тоҷикӣ". */
export function localeOptionLabel(locale: Locale) {
  return `${LOCALE_NAMES[locale].flag} ${LOCALE_NAMES[locale].name}`;
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Reads the language from a document.cookie string, for screens rendered without the root layout. */
export function localeFromCookies(cookies: string): Locale {
  const pair = cookies.split(";").find((part) => part.trim().startsWith(`${LOCALE_COOKIE}=`));
  return resolveLocale(pair?.trim().slice(LOCALE_COOKIE.length + 1));
}

export function localeCookie(locale: Locale) {
  return `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

// The proxy serves every page from an internal /tg|ru|en prefix; the browser URL never has it.
export function stripLocalePrefix(pathname: string) {
  const prefix = LOCALES.find((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  return prefix ? pathname.slice(prefix.length + 1) || "/" : pathname;
}
