import type { Metadata } from "next";
import { SabtView } from "@/components/sabt/SabtView";

export const metadata: Metadata = {
  title: "Сабти нав — Kassa AI",
};

export default function NewRecordPage() {
  return <SabtView />;
}
