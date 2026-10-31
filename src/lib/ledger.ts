import type { ApiCashCategory, ApiCashEntry, ApiCustomer, ApiDebt, ApiPaymentListItem } from "@/lib/api/types";
import { businessTime, daysBetween, isMonthKey, monthEnd, monthKey, monthStart } from "@/lib/dates";
import { formatDayMonth, formatMoney, monthName as localMonthName } from "@/lib/format";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { createT } from "@/lib/i18n/translate";
import { toDirams } from "@/lib/money";

export type LedgerKind = "income" | "expense" | "debtGiven" | "debtPaid";
export type LedgerCategory = "sale" | "goods" | "salary" | "utilities" | "transport" | "rent" | "other" | "debt";
export type LedgerSource = "voice" | "text" | "photo";
export type LedgerFilter = "all" | "income" | "expense" | "debt";

export type LedgerEntry = {
  id: string;
  date: string;
  time: string;
  title: string;
  category: LedgerCategory;
  source: LedgerSource | null;
  kind: LedgerKind;
  amount: number;
};

export type LedgerMonth = {
  month: string;
  today: string;
  months: string[];
  entries: LedgerEntry[];
};

export type LedgerApiData = {
  cashEntries: ApiCashEntry[];
  debts: ApiDebt[];
  payments: ApiPaymentListItem[];
  customers: ApiCustomer[];
};

export function categoryLabel(category: LedgerCategory, locale: Locale = DEFAULT_LOCALE) {
  return createT(locale)(`ledger.categories.${category}`);
}

const apiCategories: Record<ApiCashCategory, LedgerCategory> = {
  SALE: "sale",
  GOODS: "goods",
  SALARY: "salary",
  UTILITIES: "utilities",
  TRANSPORT: "transport",
  RENT: "rent",
  OTHER: "other",
};

const MONTHS_IN_SELECT = 12;

export function resolveMonth(param: string | undefined, today: string): string {
  const current = monthKey(today);
  return isMonthKey(param) && param <= current ? param : current;
}

export function recentMonths(today: string, count = MONTHS_IN_SELECT): string[] {
  return Array.from({ length: count }, (_, index) => monthKey(monthStart(today, -index)));
}

export function monthRange(month: string): { from: string; to: string } {
  const from = `${month}-01`;
  return { from, to: monthEnd(from) };
}

export function monthName(month: string, locale: Locale = DEFAULT_LOCALE): string {
  return localMonthName(Number(month.slice(5, 7)) - 1, locale) ?? month;
}

export function monthTitle(month: string, locale: Locale = DEFAULT_LOCALE): string {
  const name = monthName(month, locale);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${month.slice(0, 4)}`;
}

export function cashToLedger(item: ApiCashEntry): LedgerEntry {
  return {
    id: item.id,
    date: item.occurredOn,
    time: businessTime(item.createdAt),
    title: item.title,
    category: apiCategories[item.category] ?? "other",
    source: item.source === "VOICE" ? "voice" : item.source === "PHOTO" ? "photo" : "text",
    kind: item.kind === "INCOME" ? "income" : "expense",
    amount: toDirams(item.amount),
  };
}

// The customer's name and the debt description are user data; only the words around them are translated.
export function debtToLedger(debt: ApiDebt, names: Map<string, string>, locale: Locale = DEFAULT_LOCALE): LedgerEntry {
  const t = createT(locale);
  const name = names.get(debt.customerId) ?? t("ledger.unknownCustomer");
  return {
    id: `debt-${debt.id}`,
    date: debt.occurredOn,
    time: businessTime(debt.createdAt),
    title: t("ledger.debtTaken", { name, description: debt.description }),
    category: "debt",
    source: null,
    kind: "debtGiven",
    amount: toDirams(debt.amount),
  };
}

export function paymentToLedger(payment: ApiPaymentListItem, locale: Locale = DEFAULT_LOCALE): LedgerEntry {
  return {
    id: `payment-${payment.id}`,
    date: payment.paidOn,
    time: businessTime(payment.createdAt),
    title: createT(locale)("ledger.debtRepaid", { name: payment.customer.name }),
    category: "debt",
    source: null,
    kind: "debtPaid",
    amount: toDirams(payment.amount),
  };
}

export function buildLedgerEntries(data: LedgerApiData, month: string, locale: Locale = DEFAULT_LOCALE): LedgerEntry[] {
  const inMonth = (date: string) => monthKey(date) === month;
  const names = new Map(data.customers.map((customer) => [customer.id, customer.name]));
  return [
    ...data.cashEntries.filter((item) => inMonth(item.occurredOn)).map(cashToLedger),
    ...data.debts.filter((debt) => inMonth(debt.occurredOn)).map((debt) => debtToLedger(debt, names, locale)),
    ...data.payments.filter((payment) => payment.cancelledAt === null && inMonth(payment.paidOn)).map((payment) => paymentToLedger(payment, locale)),
  ];
}

export function isCash(entry: LedgerEntry) {
  return entry.kind === "income" || entry.kind === "expense";
}

export function matchesFilter(entry: LedgerEntry, filter: LedgerFilter) {
  if (filter === "all") return true;
  if (filter === "debt") return !isCash(entry);
  return entry.kind === filter;
}

// Searches what the row shows: the title, the category and the amount in the chosen language.
export function matchesQuery(entry: LedgerEntry, query: string, locale: Locale = DEFAULT_LOCALE) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return `${entry.title} ${categoryLabel(entry.category, locale)} ${formatMoney(entry.amount, { unit: false, locale })}`.toLowerCase().includes(q);
}

export function entryProfit(entry: LedgerEntry) {
  if (entry.kind === "income") return entry.amount;
  if (entry.kind === "expense") return -entry.amount;
  return 0;
}

export function monthTotals(entries: LedgerEntry[]) {
  const sum = (kind: LedgerKind) => entries.filter((entry) => entry.kind === kind).reduce((total, entry) => total + entry.amount, 0);
  const income = sum("income");
  const expense = sum("expense");
  return { income, expense, profit: income - expense };
}

export type ExpenseGroup = { category: LedgerCategory; label: string; amount: number };

export function expensesByCategory(entries: LedgerEntry[], locale: Locale = DEFAULT_LOCALE): ExpenseGroup[] {
  const totals = new Map<LedgerCategory, number>();
  for (const entry of entries) {
    if (entry.kind === "expense") totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount);
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, label: categoryLabel(category, locale), amount }))
    .sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label));
}

export function entryAmountText(entry: LedgerEntry, locale: Locale = DEFAULT_LOCALE) {
  if (entry.kind === "debtGiven") return formatMoney(entry.amount, { unit: false, locale });
  const sign = entry.kind === "expense" ? -1 : 1;
  return formatMoney(sign * entry.amount, { sign: true, unit: false, locale });
}

export function dayLabel(date: string, today: string, locale: Locale = DEFAULT_LOCALE) {
  const offset = daysBetween(today, date);
  const day = formatDayMonth(date, locale);
  if (offset === 0) return createT(locale)("ledger.today", { date: day });
  if (offset === -1) return createT(locale)("ledger.yesterday", { date: day });
  return day;
}

export type LedgerDay = { date: string; entries: LedgerEntry[]; total: number };

export function groupLedgerByDay(entries: LedgerEntry[], allEntries: LedgerEntry[] = entries): LedgerDay[] {
  const days = new Map<string, LedgerEntry[]>();
  for (const entry of entries) days.set(entry.date, [...(days.get(entry.date) ?? []), entry]);
  return [...days.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, list]) => ({
      date,
      entries: [...list].sort((a, b) => b.time.localeCompare(a.time)),
      total: allEntries.filter((entry) => entry.date === date).reduce((sum, entry) => sum + entryProfit(entry), 0),
    }));
}

export function ledgerCsv(entries: LedgerEntry[], locale: Locale = DEFAULT_LOCALE): string {
  const t = createT(locale);
  const rows = [
    [t("ledger.csv.date"), t("ledger.csv.time"), t("ledger.csv.entry"), t("ledger.csv.kind"), t("ledger.csv.category"), t("ledger.csv.amount")],
    ...[...entries]
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .map((entry) => [
        entry.date,
        entry.time,
        entry.title,
        t(`ledger.kinds.${entry.kind}`),
        categoryLabel(entry.category, locale),
        entryAmountText(entry, locale),
      ]),
  ];
  return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")).join("\r\n");
}
