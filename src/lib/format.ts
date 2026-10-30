import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

type FormatOptions = {
  sign?: boolean;
  unit?: boolean;
  locale?: Locale;
};

export const MINUS = "−";

// Fixed separators instead of Intl's locale data: Node and browsers ship different ICU versions,
// and server and client output must match exactly. Tajik keeps the app's original "1 250.50".
const NUMBER_STYLE: Record<Locale, { group: string; decimal: string }> = {
  tg: { group: " ", decimal: "." },
  ru: { group: " ", decimal: "," },
  en: { group: ",", decimal: "." },
};

const CURRENCY_UNIT: Record<Locale, string> = { tg: "смн", ru: "смн", en: "TJS" };

export function formatNumber(value: number, decimals = 0, locale: Locale = DEFAULT_LOCALE) {
  const { group, decimal } = NUMBER_STYLE[locale];
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
    .format(value)
    .replace(/[,.]/g, (separator) => (separator === "," ? group : decimal));
}

export function formatSomoni(value: number, options: FormatOptions = {}) {
  const { sign = false, unit = true, locale = DEFAULT_LOCALE } = options;
  const prefix = value < 0 ? MINUS : sign && value > 0 ? "+" : "";
  return `${prefix}${formatNumber(Math.round(Math.abs(value)), 0, locale)}${unit ? ` ${CURRENCY_UNIT[locale]}` : ""}`;
}

/** Like formatSomoni, but for exact integer dirams: "1 250", "1 250.50". */
export function formatMoney(dirams: number, options: FormatOptions = {}) {
  const { sign = false, unit = true, locale = DEFAULT_LOCALE } = options;
  const prefix = dirams < 0 ? MINUS : sign && dirams > 0 ? "+" : "";
  const absolute = Math.abs(dirams);
  const fraction = absolute % 100;
  const cents = fraction === 0 ? "" : `${NUMBER_STYLE[locale].decimal}${String(fraction).padStart(2, "0")}`;
  return `${prefix}${formatNumber(Math.floor(absolute / 100), 0, locale)}${cents}${unit ? ` ${CURRENCY_UNIT[locale]}` : ""}`;
}

// "standalone" names a month on its own ("октябрь 2026"); "day" follows a day number ("30 октября").
// Tajik uses one form for both.
const MONTHS: Record<Locale, { standalone: string[]; day: string[] }> = {
  tg: {
    standalone: ["январ", "феврал", "март", "апрел", "май", "июн", "июл", "август", "сентябр", "октябр", "ноябр", "декабр"],
    day: ["январ", "феврал", "март", "апрел", "май", "июн", "июл", "август", "сентябр", "октябр", "ноябр", "декабр"],
  },
  ru: {
    standalone: ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"],
    day: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  },
  en: {
    standalone: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    day: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  },
};

export const monthNames = MONTHS.tg.standalone;

// Index 0 is Sunday, like Date.getUTCDay(). Tajik and Russian names are lowercase, as inside a sentence.
const WEEKDAYS: Record<Locale, { long: string[]; short: string[] }> = {
  tg: {
    long: ["якшанбе", "душанбе", "сешанбе", "чоршанбе", "панҷшанбе", "ҷумъа", "шанбе"],
    short: ["Яш", "Дш", "Сш", "Чш", "Пш", "Ҷм", "Шн"],
  },
  ru: {
    long: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
    short: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  },
  en: {
    long: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    short: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
};

export function weekdayName(index: number, locale: Locale = DEFAULT_LOCALE, form: "long" | "short" = "long") {
  return WEEKDAYS[locale][form][index];
}

/** monthIndex is 0-based. Returns undefined outside 0–11 so callers can fall back. */
export function monthName(monthIndex: number, locale: Locale = DEFAULT_LOCALE, form: "standalone" | "day" = "standalone") {
  return MONTHS[locale][form][monthIndex];
}

/** "2026-10-30" → "30 октябр" (tg), "30 октября" (ru), "October 30" (en). */
export function formatDayMonth(date: string, locale: Locale = DEFAULT_LOCALE) {
  const [, month, day] = date.split("-").map(Number);
  const name = monthName(month - 1, locale, "day");
  return locale === "en" ? `${name} ${day}` : `${day} ${name}`;
}

/** "2026-10-30" → "30 октябр 2026" (tg), "30 октября 2026" (ru), "October 30, 2026" (en). */
export function formatDate(date: string, locale: Locale = DEFAULT_LOCALE) {
  const year = Number(date.slice(0, 4));
  return locale === "en" ? `${formatDayMonth(date, locale)}, ${year}` : `${formatDayMonth(date, locale)} ${year}`;
}

/** "2026-10" → "октябр 2026" (tg), "октябрь 2026" (ru), "October 2026" (en). */
export function formatMonth(month: string, locale: Locale = DEFAULT_LOCALE) {
  const name = monthName(Number(month.slice(5, 7)) - 1, locale);
  return name ? `${name} ${month.slice(0, 4)}` : month;
}
