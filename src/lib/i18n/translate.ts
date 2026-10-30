import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { dictionaries, type Dictionary } from "@/lib/i18n/dictionaries";

// "nav.today" style keys, checked against the dictionary shape at compile time.
type Leaves<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<Dictionary>;
export type TranslateVars = Record<string, string | number>;
export type Translate = (key: MessageKey, vars?: TranslateVars) => string;

function lookup(dictionary: Dictionary, key: string): string | undefined {
  let node: unknown = dictionary;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

// "{name}" placeholders are filled from vars; unknown placeholders are left as they are.
function fill(text: string, vars?: TranslateVars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

// A missing text falls back to Tajik, then to the key itself, so a gap never breaks a page.
export function createT(locale: Locale): Translate {
  return (key, vars) => fill(lookup(dictionaries[locale], key) ?? lookup(dictionaries[DEFAULT_LOCALE], key) ?? key, vars);
}

// Plural texts are groups with one/few/many/other keys, filled with {count}.
// Tajik doesn't change a noun after a number ("3 нафар"); Russian has three forms, English two.
export type PluralForm = "one" | "few" | "many" | "other";
export type PluralKey = MessageKey extends infer K ? (K extends `${infer Base}.other` ? Base : never) : never;

export function pluralForm(locale: Locale, count: number): PluralForm {
  const n = Math.abs(Math.trunc(count));
  if (locale === "ru") {
    if (n % 10 === 1 && n % 100 !== 11) return "one";
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) return "few";
    return "many";
  }
  if (locale === "en") return n === 1 ? "one" : "other";
  return "other";
}

export type Plural = (key: PluralKey, count: number, vars?: TranslateVars) => string;

export function createPlural(locale: Locale): Plural {
  const t = createT(locale);
  return (key, count, vars) => t(`${key}.${pluralForm(locale, count)}` as MessageKey, { count, ...vars });
}
