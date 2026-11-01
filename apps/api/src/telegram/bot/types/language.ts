export type Lang = "tg" | "ru" | "en";

export const LANGS: readonly Lang[] = ["tg", "ru", "en"];

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}