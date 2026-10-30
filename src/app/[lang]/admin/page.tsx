import type { Metadata } from "next";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("admin.overview")} — Kassa AI` };
}

export default async function AdminOverviewPage() {
  const t = await getT();
  return (
    <div className="flex flex-wrap items-center gap-3 py-6">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">{t("admin.overview")}</h1>
      <DemoBadge />
    </div>
  );
}
