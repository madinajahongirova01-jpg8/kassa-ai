import type { ApiCashCategory, ApiEntrySource } from "@/lib/api/types";
import { DIRAMS_PER_SOMONI, toApiAmount } from "@/lib/money";

export type SabtKind = "income" | "expense";

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
  kind?: SabtKind;
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
  { match: /такси/i, title: () => "Такси", note: "роҳкиро", category: "TRANSPORT" },
  { match: /коргар|маош/i, title: () => "Музди коргар", note: "маош", category: "SALARY" },
  { match: /фурӯш/i, title: () => "Фурӯш", note: "даромад", category: "SALE", kind: "income" },
];

const INCOME_WORDS = /фурӯш|даромад|омад|супорид|баргардонд/i;
// \b does not see Cyrillic letters as word characters, so match on whitespace instead.
const FILLER_WORDS = /(^|\s)(имрӯз|дирӯз|ба|боз|гирифтам|додам|шуд|кардам|сомонӣ|смн)(?=\s|$)/gi;
const UNIT_AFTER = /^\s*(халта|кг|л|литр|дона|қуттӣ)/i;

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function fallbackTitle(clause: string) {
  const words = clause.replace(/\d+/g, "").replace(FILLER_WORDS, "").replace(/\s+/g, " ").trim();
  return words ? capitalize(words) : "Сабт";
}

/** Demo parser: one entry per clause that holds an amount, e.g. «такси 30». */
export function parseSabt(text: string): SabtEntry[] {
  const entries: SabtEntry[] = [];
  for (const clause of text.matchAll(/[^,.;!?«»"]+/g)) {
    const body = clause[0];
    const amount = [...body.matchAll(/\d+/g)].findLast((n) => !UNIT_AFTER.test(body.slice(n.index + n[0].length)));
    if (!amount) continue;
    const rule = rules.find((r) => r.match.test(body));
    const start = clause.index + amount.index;
    entries.push({
      id: `s${entries.length + 1}`,
      title: rule ? rule.title(body) : fallbackTitle(body),
      note: rule?.note ?? "дигар",
      kind: rule?.kind ?? (INCOME_WORDS.test(body) ? "income" : "expense"),
      category: rule?.category ?? "OTHER",
      amount: Number(amount[0]),
      start,
      end: start + amount[0].length,
    });
  }
  return entries;
}

export function canSaveSabt(entries: SabtEntry[]) {
  return entries.every((entry) => entry.amount > 0 && entry.amount <= MAX_SABT_AMOUNT);
}

export function toCashEntriesPayload(entries: SabtEntry[], source: ApiEntrySource) {
  return {
    entries: entries.map((entry) => ({
      kind: entry.kind === "income" ? "INCOME" : "EXPENSE",
      category: entry.category,
      amount: toApiAmount(entry.amount * DIRAMS_PER_SOMONI),
      title: entry.title.slice(0, 200),
      source,
    })),
  };
}

export function sabtProfit(entries: SabtEntry[]) {
  return entries.reduce((sum, e) => sum + (e.kind === "income" ? e.amount : -e.amount), 0);
}
