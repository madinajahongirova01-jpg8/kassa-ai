import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/daftar/PageState";
import { LedgerView } from "@/components/ledger/LedgerView";
import { loadLedgerMonth } from "@/lib/api/ledger-book";

export const metadata: Metadata = {
  title: "Дафтар — Kassa AI",
};

export default function TransactionsPage({ searchParams }: PageProps<"/app/transactions">) {
  return (
    <Suspense fallback={<PageLoading text="дафтар кушода мешавад…" />}>
      <Transactions searchParams={searchParams} />
    </Suspense>
  );
}

async function Transactions({ searchParams }: Pick<PageProps<"/app/transactions">, "searchParams">) {
  const { month } = await searchParams;
  const ledger = await loadLedgerMonth(typeof month === "string" ? month : undefined, "/app/transactions");
  return <LedgerView key={ledger.month} ledger={ledger} />;
}
