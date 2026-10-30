"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/I18nProvider";
import { appNav } from "@/data/navigation";
import { cn } from "@/lib/cn";
import { isNavActive } from "@/lib/nav";
import { usePagePathname } from "@/lib/usePagePathname";

export function NavPill() {
  const pathname = usePagePathname();
  const t = useT();
  return (
    <nav aria-label={t("nav.main")} className="flex gap-1.5 rounded-full border-[1.5px] border-ink bg-card p-1">
      {appNav.map((item) => {
        const active = isNavActive(pathname, item.href, "/app");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-[18px] py-2 text-sm",
              active ? "bg-ink font-semibold text-card" : "font-medium text-ink hover:text-pen",
            )}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
