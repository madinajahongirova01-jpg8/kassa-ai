import type { Kpi } from "@/data/types";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between pb-space-xs">
        <span className="font-body-md text-body-md text-outline">{kpi.label}</span>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", kpi.iconClassName)}>
          <Icon name={kpi.icon} className="text-lg" />
        </span>
      </div>
      <div className={cn("font-display-hero text-display-hero font-extrabold tracking-tight tnum", kpi.valueClassName)}>
        {formatNumber(kpi.value)} <span className="font-body-md text-body-md font-normal text-outline">смн</span>
      </div>
      <div className="flex items-center gap-space-xs pt-space-xs">
        <Pill tone={kpi.badgeTone} icon={kpi.badgeIcon} dot={!kpi.badgeIcon} className="font-bold">
          {kpi.badge}
        </Pill>
        <span className="font-body-sm text-body-sm text-outline">{kpi.note}</span>
      </div>
    </div>
  );
}

export function KpiCardCompact({ kpi }: { kpi: Kpi }) {
  const { compact } = kpi;
  return (
    <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-sm shadow-[0_1px_4px_rgba(15,42,35,0.03)]">
      <div className="flex items-center justify-between gap-1">
        <span className="font-body-sm text-body-sm font-medium text-on-surface-variant">{compact.label}</span>
        <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", compact.iconClassName)}>
          <Icon name={compact.icon} className="text-[14px]" />
        </span>
      </div>
      <div className="mt-2">
        <div className={cn("font-headline-sm text-headline-sm font-bold tnum", compact.valueClassName)}>
          {formatNumber(kpi.value)} <span className="text-body-sm font-normal text-on-surface-variant">смн</span>
        </div>
        <span className={cn("font-label-caps text-[10px] font-bold", compact.noteClassName)}>{compact.note}</span>
      </div>
    </div>
  );
}
