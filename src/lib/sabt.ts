import type { ApiCashCategory, ApiEntrySource } from "@/lib/api/types";
import { DIRAMS_PER_SOMONI, toApiAmount } from "@/lib/money";

export type SabtKind = "income" | "expense" | "debt";

export const MAX_SABT_AMOUNT = 10_000_000;

export type SabtEntry = {
  id: string;
  title: string;
  note: string;
  kind: SabtKind;
  category: ApiCashCategory;
  amount: number;
  start: number;
  end: number;
};

type Rule = {
  match: RegExp;
  title: (clause: string) => string;
  note: string;
  category: ApiCashCategory;
  kind?: "income" | "expense";
};

const rules: Rule[] = [
  {
    match: /орд/i,
    title: (clause) => {
      const bags = clause.match(/(\d+)\s*халта/i);
      return bags ? `Орд, ${bags[1]} халта` : "Орд";
    },
    note: "мол барои дӯкон",
    category: "GOODS",
  },
  { match: /мук[аиуе]/i, title: () => "Мука", note: "товар", category: "GOODS" },
  { match: /\bflour\b/i, title: () => "Flour", note: "goods", category: "GOODS" },
  { match: /такси/i, title: () => "Такси", note: "роҳкиро", category: "TRANSPORT" },
  { match: /\btaxi\b/i, title: () => "Taxi", note: "transport", category: "TRANSPORT" },
  { match: /коргар|маош/i, title: () => "Музди коргар", note: "маош", category: "SALARY" },
  { match: /зарплат/i, title: () => "Зарплата", note: "зарплата", category: "SALARY" },
  { match: /\b(salary|wages?)\b/i, title: () => "Salary", note: "salary", category: "SALARY" },
  { match: /иҷора/i, title: () => "Иҷора", note: "иҷора", category: "RENT" },
  { match: /аренд/i, title: () => "Аренда", note: "аренда", category: "RENT" },
  { match: /\brent\b/i, title: () => "Rent", note: "rent", category: "RENT" },
  { match: /фурӯш/i, title: () => "Фурӯш", note: "даромад", category: "SALE", kind: "income" },
  { match: /продаж|продал|выручк/i, title: () => "Продажа", note: "доход", category: "SALE", kind: "income" },
  { match: /\b(sales?|sold|revenue)\b/i, title: () => "Sale", note: "income", category: "SALE", kind: "income" },
];

const INCOME_WORDS = /фурӯш|даромад|омад|супорид|доход|выручк|\bincome\b|\brevenue\b/i;
const DEBT_WORDS = /насия|қарз|баргардонд|долг|долж|\bdebts?\b|\bowes?\b|on credit/i;
// \b does not see Cyrillic letters as word characters, so match on whitespace instead.
const FILLER_WORDS = /(^|\s)(имрӯз|дирӯз|ба|боз|гирифтам|додам|шуд|кардам|сомонӣ|смн|сегодня|вчера|за|на|купил|заплатил|сомони|today|yesterday|for|paid|bought|somoni|tjs)(?=\s|$)/gi;
const UNIT_AFTER = /^\s*(халта|кг|л|литр|дона|қуттӣ|мешок|мешка|мешков|шт|kg|bags?|pcs)/i;

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function fallbackTitle(clause: string) {
  const words = clause.replace(/\d+/g, "").replace(FILLER_WORDS, "").replace(/\s+/g, " ").trim();
  return words ? capitalize(words) : "Сабт";
}

export function parseSabt(text: string): SabtEntry[] {
  const entries: SabtEntry[] = [];
  for (const clause of text.matchAll(/[^,.;!?«»"]+/g)) {
    const body = clause[0];
    const amount = [...body.matchAll(/\d+/g)].findLast((n) => !UNIT_AFTER.test(body.slice(n.index + n[0].length)));
    if (!amount) continue;
    const debt = DEBT_WORDS.test(body);
    const rule = debt ? undefined : rules.find((r) => r.match.test(body));
    const start = clause.index + amount.index;
    entries.push({
      id: `s${entries.length + 1}`,
      title: rule ? rule.title(body) : fallbackTitle(body),
      note: debt ? "насия" : (rule?.note ?? "дигар"),
      kind: debt ? "debt" : (rule?.kind ?? (INCOME_WORDS.test(body) ? "income" : "expense")),
      category: rule?.category ?? "OTHER",
      amount: Number(amount[0]),
      start,
      end: start + amount[0].length,
    });
  }
  return entries;
}

export function cashSabtEntries(entries: SabtEntry[]) {
  return entries.filter((entry) => entry.kind !== "debt");
}

export function debtSabtEntries(entries: SabtEntry[]) {
  return entries.filter((entry) => entry.kind === "debt");
}

export function canSaveSabt(entries: SabtEntry[]) {
  return cashSabtEntries(entries).every((entry) => entry.amount > 0 && entry.amount <= MAX_SABT_AMOUNT);
}

export function toCashEntriesPayload(entries: SabtEntry[], source: ApiEntrySource) {
  return {
    entries: cashSabtEntries(entries).map((entry) => ({
      kind: entry.kind === "income" ? "INCOME" : "EXPENSE",
      category: entry.category,
      amount: toApiAmount(entry.amount * DIRAMS_PER_SOMONI),
      title: entry.title.slice(0, 200),
      source,
    })),
  };
}

export function sabtProfit(entries: SabtEntry[]) {
  return cashSabtEntries(entries).reduce((sum, e) => sum + (e.kind === "income" ? e.amount : -e.amount), 0);
}
