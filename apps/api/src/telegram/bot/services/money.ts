import type { Lang } from "../types/language";

export const DIRAMS_PER_SOMONI = 100;

const CURRENCY: Record<Lang, string> = {
  tg: "сомонӣ",
  ru: "сомони",
  en: "somoni",
};

export function somoniTextToDiram(text: string): number | null {
  const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(text);
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = match[2] ? Number(match[2].padEnd(2, "0")) : 0;
  const total = whole * DIRAMS_PER_SOMONI + fraction;
  return Number.isSafeInteger(total) && total > 0 ? total : null;
}

export function diramTextToDiram(text: string): number | null {
  if (!/^\d+$/.test(text)) return null;
  const total = Number(text);
  return Number.isSafeInteger(total) && total > 0 ? total : null;
}

export function formatDiram(diram: number, lang: Lang = "tg"): string {
  const whole = Math.floor(diram / DIRAMS_PER_SOMONI);
  const fraction = diram % DIRAMS_PER_SOMONI;
  const currency = CURRENCY[lang];
  if (fraction === 0) return `${whole} ${currency}`;
  return `${whole}.${String(fraction).padStart(2, "0")} ${currency}`;
}