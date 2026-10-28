import type { Metadata } from "next";
import { LedgerView } from "@/components/ledger/LedgerView";

export const metadata: Metadata = {
  title: "Дафтар — Kassa AI",
};

export default function TransactionsPage() {
  return <LedgerView />;
}
