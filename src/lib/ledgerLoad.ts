import type { ApiCashEntry, ApiCustomer, ApiDebt, ApiPaymentListItem } from "@/lib/api/types";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { buildLedgerEntries, monthRange, recentMonths, resolveMonth, type LedgerMonth } from "@/lib/ledger";

export type LedgerApi = {
  get: <T>(path: string) => Promise<T>;
  getAll: <T>(path: string, query: Record<string, string>) => Promise<T[]>;
};

export async function fetchLedgerMonth(
  monthParam: string | undefined,
  today: string,
  api: LedgerApi,
  locale: Locale = DEFAULT_LOCALE,
): Promise<LedgerMonth> {
  const month = resolveMonth(monthParam, today);
  const range = monthRange(month);
  const [cashEntries, debts, payments, customers] = await Promise.all([
    api.getAll<ApiCashEntry>("/cash-entries", range),
    api.get<ApiDebt[]>("/debts"),
    api.getAll<ApiPaymentListItem>("/payments", range),
    api.get<ApiCustomer[]>("/customers"),
  ]);
  return {
    month,
    today,
    months: recentMonths(today),
    entries: buildLedgerEntries({ cashEntries, debts, payments, customers }, month, locale),
  };
}
