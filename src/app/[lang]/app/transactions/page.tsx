import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/daftar/PageState";
import { LedgerView } from "@/components/ledger/LedgerView";
import { loadLedgerMonth } from "@/lib/api/ledger-book";
import { getLocale, getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("nav.ledger")} — Kassa AI` };
}

export default async function TransactionsPage({ searchParams }: PageProps<"/[lang]/app/transactions">) {
  const t = await getT();
  return (
    <Suspense fallback={<PageLoading text={t("ledger.loading")} />}>
      <Transactions searchParams={searchParams} />
    </Suspense>
  );
}

async function Transactions({ searchParams }: Pick<PageProps<"/[lang]/app/transactions">, "searchParams">) {
  const { month } = await searchParams;
  const ledger = await loadLedgerMonth(typeof month === "string" ? month : undefined, "/app/transactions", await getLocale());
  return <LedgerView key={ledger.month} ledger={ledger} />;
}
