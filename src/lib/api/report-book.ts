import "server-only";
import { connection } from "next/server";
import { sessionGet } from "@/lib/api/session-data";
import { businessToday } from "@/lib/dates";
import { fetchReportData } from "@/lib/hisobot";

export async function loadReportData(returnTo: string) {
  await connection();
  return fetchReportData(businessToday(), { get: <T>(path: string) => sessionGet<T>(path, returnTo) });
}
