"use client";

import { KpiCard, KpiCardCompact } from "@/components/ui/KpiCard";
import { debtKpi, overviewKpis } from "@/data/overview";
import { useDebtOverview } from "@/lib/useDebtOverview";

export function OverviewKpis({ compact = false }: { compact?: boolean }) {
  const { totals } = useDebtOverview();
  const kpis = [...overviewKpis, debtKpi(totals)];

  if (compact) {
    return (
      <section className="grid grid-cols-2 gap-space-sm">
        {kpis.map((kpi) => (
          <KpiCardCompact key={kpi.label} kpi={kpi} />
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-2 gap-space-md xl:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} kpi={kpi} />
      ))}
    </section>
  );
}
