import "server-only";
import { connection } from "next/server";
import { sessionGet, sessionGetAll } from "@/lib/api/session-data";
import { businessToday } from "@/lib/dates";
import type { Locale } from "@/lib/i18n/config";
import { fetchLedgerMonth } from "@/lib/ledgerLoad";

export async function loadLedgerMonth(monthParam: string | undefined, returnTo: string, locale: Locale) {
  await connection();
  return fetchLedgerMonth(
    monthParam,
    businessToday(),
    {
      get: <T>(path: string) => sessionGet<T>(path, returnTo),
      getAll: <T>(path: string, query: Record<string, string>) => sessionGetAll<T>(path, query, returnTo),
    },
    locale,
  );
}
