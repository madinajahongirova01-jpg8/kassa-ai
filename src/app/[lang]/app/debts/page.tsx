import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/daftar/PageState";
import { NasiyaView } from "@/components/nasiya/NasiyaView";
import { loadDebtBook } from "@/lib/api/debt-book";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("nav.debts")} — Kassa AI` };
}

export default async function DebtsPage() {
  const t = await getT();
  return (
    <Suspense fallback={<PageLoading text={t("nasiya.loading")} />}>
      <Debts />
    </Suspense>
  );
}

// Reads the session, so it streams in behind the Suspense boundary on every request.
async function Debts() {
  const book = await loadDebtBook("/app/debts", { withPayments: true });
  return <NasiyaView book={book} />;
}
