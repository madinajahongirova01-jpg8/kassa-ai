import type { SabtEntry } from "@kassa/sabt-rules";
import type { ApiEntrySource } from "@/lib/api/types";
import { DIRAMS_PER_SOMONI, toApiAmount } from "@/lib/money";

export { isDebtText, parseSabt, SABT_CATEGORIES, SABT_KINDS } from "@kassa/sabt-rules";
export type { SabtCategory, SabtEntry, SabtKind } from "@kassa/sabt-rules";

export const MAX_SABT_AMOUNT = 10_000_000;

export function entryDirams(entry: Pick<SabtEntry, "amount">) {
  return Math.round(entry.amount * DIRAMS_PER_SOMONI);
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
      amount: toApiAmount(entryDirams(entry)),
      title: entry.title.slice(0, 200),
      source,
    })),
  };
}

export function sabtProfit(entries: SabtEntry[]) {
  const dirams = cashSabtEntries(entries).reduce((sum, e) => sum + (e.kind === "income" ? entryDirams(e) : -entryDirams(e)), 0);
  return dirams / DIRAMS_PER_SOMONI;
}
