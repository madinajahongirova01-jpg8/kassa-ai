import type { Metadata } from "next";
import { ReportView } from "@/components/hisobot/ReportView";

export const metadata: Metadata = {
  title: "Ҳисобот — Kassa AI",
};

export default function ReportsPage() {
  return <ReportView />;
}
