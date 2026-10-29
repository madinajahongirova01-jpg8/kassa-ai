import "server-only";
import { connection } from "next/server";
import { sessionGetAll } from "@/lib/api/session-data";
import type { ApiCashEntry } from "@/lib/api/types";
import { businessToday } from "@/lib/dates";
import { toTodayCashEntries } from "@/lib/todayCash";

export async function loadTodayCashEntries(returnTo: string) {
  await connection();
  const today = businessToday();
  const items = await sessionGetAll<ApiCashEntry>("/cash-entries", { from: today, to: today }, returnTo);
  return toTodayCashEntries(items);
}
