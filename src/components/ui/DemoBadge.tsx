"use client";

import { useT } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";

export function DemoBadge({ className }: { className?: string }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border-[1.5px] border-dashed border-ink-3 bg-card px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-ink-2",
        className,
      )}
    >
      {t("common.demoData")}
    </span>
  );
}
