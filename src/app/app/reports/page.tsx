import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/daftar/PageState";
import { ReportView } from "@/components/hisobot/ReportView";
import { loadReportData } from "@/lib/api/report-book";

export const metadata: Metadata = {
  title: "Ҳисобот — Kassa AI",
};

export default function ReportsPage() {
  return (
    <Suspense fallback={<PageLoading text="ҳисобот тайёр мешавад…" />}>
      <Reports />
    </Suspense>
  );
}

async function Reports() {
  const data = await loadReportData("/app/reports");
  return <ReportView data={data} />;
}
