import type { Metadata } from "next";
import { DebtsView } from "@/components/debts/DebtsView";

export const metadata: Metadata = {
  title: "Насия — Kassa AI",
};

export default function DebtsPage() {
  return <DebtsView />;
}
