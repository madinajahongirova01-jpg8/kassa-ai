"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/I18nProvider";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export function SettingsLink({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const label = t("nav.settings");
  return (
    <Link
      href="/app/settings"
      aria-label={compact ? label : undefined}
      title={compact ? label : undefined}
      className={cn(
        "flex h-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink bg-card text-sm font-semibold text-ink hover:text-pen print:hidden",
        compact ? "w-9" : "px-4",
      )}
    >
      {compact ? <Icon name="settings" className="text-[20px]" /> : label}
    </Link>
  );
}
