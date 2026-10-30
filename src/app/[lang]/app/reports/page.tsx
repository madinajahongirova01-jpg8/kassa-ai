import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/daftar/PageState";
import { ReportView } from "@/components/hisobot/ReportView";
import { loadReportData } from "@/lib/api/report-book";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("nav.reports")} — Kassa AI` };
}

export default async function ReportsPage() {
  const t = await getT();
  return (
    <Suspense fallback={<PageLoading text={t("report.loading")} />}>
      <Reports />
    </Suspense>
  );
}

async function Reports() {
  const data = await loadReportData("/app/reports");
  return <ReportView data={data} />;
}
