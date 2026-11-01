import type { ParsedTransaction } from "../types/transaction";
import { diramTextToDiram, somoniTextToDiram } from "./money";

const FOLD_MAP: Record<string, string> = {
  "ҷ": "ч", "ҳ": "х", "қ": "к", "ғ": "г", "ӯ": "у", "ӣ": "и", "ё": "е",
};

function fold(text: string): string {
  return text.toLowerCase().replace(/[ҷҳқғӯӣё]/g, (c) => FOLD_MAP[c] ?? c);
}

const DEBT_PAYMENT = [
  "баргардон", "вернул", "погас", "погаш", "возврат", "returned", "repaid", "payback",
  "bargardon", "bozgardon", "pardokht kard",
];
const CREDIT = [
  "насия", "нася", "долг", "кредит", "карз", "credit", "debt", "owe", "loan",
  "nasiya", "nasia", "nasya", "qarz", "karz", "garz",
];
const EXPENSE = [
  "харочот", "харч", "харид", "пардохт", "купил", "расход", "потрат", "заплат",
  "оплат", "израсход", "bought", "buy", "spent", "spend", "expens", "purchas",
  "xarid", "harid", "kharid", "xaroj", "haroj", "kharoj", "pardoxt", "pardokht",
];
const NOT_EXPENSE = ["харидор", "buyer", "xaridor", "haridor", "kharidor"];
const SALE = [
  "фуруш", "фурухт", "даромад", "продал", "продаж", "продан", "выручк", "доход",
  "sold", "sell", "sale", "income", "earn", "revenue",
  "furush", "furuxt", "furukht", "furosh", "daromad", "farush", "furoxt",
];

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

function matchesStem(word: string, stem: string): boolean {
  if (word.startsWith(stem)) return true;
  if (stem.length < 5) return false;
  for (let len = stem.length - 1; len <= stem.length + 1; len++) {
    if (word.length >= len && levenshtein(word.slice(0, len), stem) <= 1) return true;
  }
  return false;
}

function matchesAny(word: string, stems: string[]): boolean {
  return stems.some((s) => matchesStem(word, s));
}

function startsWithAny(word: string, prefixes: string[]): boolean {
  return prefixes.some((p) => word.startsWith(p));
}

function hasKeyword(words: string[], stems: string[]): boolean {
  return words.some((w) => matchesAny(w, stems));
}

function isKeywordWord(foldedWord: string): boolean {
  return (
    matchesAny(foldedWord, DEBT_PAYMENT) ||
    matchesAny(foldedWord, CREDIT) ||
    matchesAny(foldedWord, EXPENSE) ||
    matchesAny(foldedWord, SALE)
  );
}

function wordsOf(foldedText: string): string[] {
  return foldedText.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

const UNIT_RE =
  /(\d+(?:[.,]\d{1,2})?)\s*(сомон[иӣ]?|сомӣ|сом|смн|somoni|somon|somon[iy]|somi|som|smn|tjs|дирам[иӣ]?|дир|dirams?|diram)(?![\p{L}])/giu;

export function extractAmountDiram(text: string): number | null {
  const cleaned = text.replace(/(\d)[ \u00A0](?=\d{3}(?!\d))/g, "$1");

  const withUnit = [...cleaned.matchAll(UNIT_RE)];
  if (withUnit.length === 1) {
    const [, number, unit] = withUnit[0];
    return /^(дир|diram)/i.test(unit) ? diramTextToDiram(number) : somoniTextToDiram(number);
  }
  if (withUnit.length > 1) return null;

  const numbers = cleaned.match(/\d+(?:[.,]\d{1,2})?/g);
  if (numbers && numbers.length === 1) return somoniTextToDiram(numbers[0]);
  return null;
}

function capitalize(name: string): string {
  return name.charAt(0).toLocaleUpperCase() + name.slice(1);
}

export function extractCustomerName(text: string): string | null {
  const prep = /(?:^|[\s,])(?:ба|барои|для|клиенту|от|аз|to|for|from|ba|baroi)\s+([\p{L}]+)/iu.exec(text);
  if (prep && !isKeywordWord(fold(prep[1]))) return capitalize(prep[1]);

  for (const word of text.split(/[^\p{L}]+/u).filter(Boolean)) {
    if (/^\p{Lu}/u.test(word) && !isKeywordWord(fold(word))) return word;
  }
  return null;
}

export function parseTransactionText(rawText: string): ParsedTransaction | null {
  const text = rawText.trim();
  if (text.length === 0 || text.length > 500) return null;

  const folded = fold(text);
  const words = wordsOf(folded);
  const amountDiram = extractAmountDiram(text);
  if (amountDiram === null) return null;

  const isDebtPayment =
    hasKeyword(words, DEBT_PAYMENT) || /\bpa(id|y)\s+back\b/.test(folded);
  const isCredit = hasKeyword(words, CREDIT);
  const isExpense =
    words.some((w) => matchesAny(w, EXPENSE) && !startsWithAny(w, NOT_EXPENSE)) ||
    /\bpaid\s+for\b/.test(folded);
  const isSale = hasKeyword(words, SALE);

  let type: ParsedTransaction["type"] | null = null;
  if (isDebtPayment) type = "debt_payment";
  else if (isCredit && !isExpense) type = "credit_sale";
  else if (isExpense) type = "expense";
  else if (isSale) type = "sale";

  if (type === null) return null;

  const needsCustomer = type === "credit_sale" || type === "debt_payment";
  return {
    type,
    amountDiram,
    description: text.slice(0, 200),
    customerName: needsCustomer ? extractCustomerName(text) : null,
  };
}