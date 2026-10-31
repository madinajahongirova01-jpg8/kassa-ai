export type SabtKind = 'income' | 'expense' | 'debt';

export type SabtCategory = 'SALE' | 'GOODS' | 'SALARY' | 'UTILITIES' | 'TRANSPORT' | 'RENT' | 'OTHER';

export const SABT_KINDS: readonly SabtKind[] = ['income', 'expense', 'debt'];

export const SABT_CATEGORIES: readonly SabtCategory[] = ['SALE', 'GOODS', 'SALARY', 'UTILITIES', 'TRANSPORT', 'RENT', 'OTHER'];

export type SabtEntry = {
  id: string;
  title: string;
  note: string;
  kind: SabtKind;
  category: SabtCategory;
  amount: number;
  start: number;
  end: number;
};

type Rule = {
  match: RegExp;
  title: (clause: string) => string;
  note: string;
  category: SabtCategory;
  kind?: 'income' | 'expense';
};

const rules: Rule[] = [
  {
    match: /орд/i,
    title: (clause) => {
      const bags = clause.match(/(\d+)\s*халта/i);
      return bags ? `Орд, ${bags[1]} халта` : 'Орд';
    },
    note: 'мол барои дӯкон',
    category: 'GOODS',
  },
  { match: /мук[аиуе]/i, title: () => 'Мука', note: 'товар', category: 'GOODS' },
  { match: /\bflour\b/i, title: () => 'Flour', note: 'goods', category: 'GOODS' },
  { match: /такси/i, title: () => 'Такси', note: 'роҳкиро', category: 'TRANSPORT' },
  { match: /\btaxi\b/i, title: () => 'Taxi', note: 'transport', category: 'TRANSPORT' },
  { match: /коргар|маош/i, title: () => 'Музди коргар', note: 'маош', category: 'SALARY' },
  { match: /зарплат/i, title: () => 'Зарплата', note: 'зарплата', category: 'SALARY' },
  { match: /\b(salary|wages?)\b/i, title: () => 'Salary', note: 'salary', category: 'SALARY' },
  { match: /иҷора/i, title: () => 'Иҷора', note: 'иҷора', category: 'RENT' },
  { match: /аренд/i, title: () => 'Аренда', note: 'аренда', category: 'RENT' },
  { match: /\brent\b/i, title: () => 'Rent', note: 'rent', category: 'RENT' },
  { match: /фурӯш/i, title: () => 'Фурӯш', note: 'даромад', category: 'SALE', kind: 'income' },
  { match: /продаж|продал|выручк/i, title: () => 'Продажа', note: 'доход', category: 'SALE', kind: 'income' },
  { match: /\b(sales?|sold|revenue)\b/i, title: () => 'Sale', note: 'income', category: 'SALE', kind: 'income' },
];

const INCOME_WORDS = /фурӯш|даромад|омад|супорид|доход|выручк|\bincome\b|\brevenue\b/i;
const DEBT_WORDS = /насия|қарз|баргардонд|долг|долж|\bdebts?\b|\bowes?\b|on credit/i;
const FILLER_WORDS =
  /(^|\s)(имрӯз|дирӯз|ба|боз|гирифтам|додам|шуд|кардам|сомонӣ|смн|сегодня|вчера|за|на|купил|заплатил|сомони|today|yesterday|for|paid|bought|somoni|tjs)(?=\s|$)/gi;
const UNIT_AFTER = /^\s*(халта|кг|л|литр|дона|қуттӣ|мешок|мешка|мешков|шт|kg|bags?|pcs)/i;

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function fallbackTitle(clause: string): string {
  const words = clause.replace(/\d+/g, '').replace(FILLER_WORDS, '').replace(/\s+/g, ' ').trim();
  return words ? capitalize(words) : 'Сабт';
}

export function isDebtText(text: string): boolean {
  return DEBT_WORDS.test(text);
}

export function parseSabt(text: string): SabtEntry[] {
  const entries: SabtEntry[] = [];
  for (const clause of text.matchAll(/[^,.;!?«»"]+/g)) {
    const body = clause[0];
    const amount = [...body.matchAll(/\d+/g)].findLast((n) => !UNIT_AFTER.test(body.slice(n.index + n[0].length)));
    if (!amount) continue;
    const debt = isDebtText(body);
    const rule = debt ? undefined : rules.find((r) => r.match.test(body));
    const start = clause.index + amount.index;
    entries.push({
      id: `s${entries.length + 1}`,
      title: rule ? rule.title(body) : fallbackTitle(body),
      note: debt ? 'насия' : (rule?.note ?? 'дигар'),
      kind: debt ? 'debt' : (rule?.kind ?? (INCOME_WORDS.test(body) ? 'income' : 'expense')),
      category: rule?.category ?? 'OTHER',
      amount: Number(amount[0]),
      start,
      end: start + amount[0].length,
    });
  }
  return entries;
}
