import type { Metadata } from "next";
import { NasiyaView } from "@/components/nasiya/NasiyaView";

export const metadata: Metadata = {
  title: "Насия — Kassa AI",
};

export default function DebtsPage() {
  return <NasiyaView />;
}
