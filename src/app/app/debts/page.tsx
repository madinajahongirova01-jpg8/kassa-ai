import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/daftar/PageState";
import { NasiyaView } from "@/components/nasiya/NasiyaView";
import { loadDebtBook } from "@/lib/api/debt-book";

export const metadata: Metadata = {
  title: "Насия — Kassa AI",
};

export default function DebtsPage() {
  return (
    <Suspense fallback={<PageLoading text="варақҳои насия кушода мешаванд…" />}>
      <Debts />
    </Suspense>
  );
}

// Reads the session, so it streams in behind the Suspense boundary on every request.
async function Debts() {
  const book = await loadDebtBook("/app/debts", { withPayments: true });
  return <NasiyaView book={book} />;
}
