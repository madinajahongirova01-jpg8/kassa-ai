"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { systemStatus } from "@/data/admin";
import { adminSidebarNav } from "@/data/navigation";
import { cn } from "@/lib/cn";
import { isNavActive } from "@/lib/nav";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 z-50 hidden h-full w-72 flex-col justify-between bg-surface-container-low px-4 py-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] lg:flex">
      <div className="flex flex-col gap-6">
        <Link href="/admin" className="flex items-center gap-3 px-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary shadow-xs">
            <Icon name="receipt_long" className="text-[24px]" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface">Kassa AI</span>
            <span className="font-label-caps text-label-caps tracking-wider text-on-surface-variant uppercase">
              Панели идоракунӣ
            </span>
          </div>
        </Link>
        <div className="px-3">
          <div className="h-px w-full bg-outline-variant/30" />
        </div>
        <nav className="flex flex-col gap-1.5">
          {adminSidebarNav.map((item) => {
            const active = isNavActive(pathname, item.href, "/admin");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-colors",
                  active
                    ? "bg-primary font-headline-sm text-body-md font-semibold text-on-primary shadow-xs"
                    : "font-body-md text-body-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
                )}
              >
                <Icon name={item.icon} className="text-[20px]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-4 px-3">
        <div className="flex flex-col gap-2 rounded-xl bg-surface-container-high/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Система</span>
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          </div>
          <div className="flex items-center justify-between font-body-sm text-body-sm">
            <span className="text-on-surface-variant">Нусхаи нармафзор</span>
            <span className="font-tabular-ledger text-tabular-ledger text-on-surface">{systemStatus.version}</span>
          </div>
        </div>
        <div className="flex items-center justify-between px-1 font-body-sm text-body-sm text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <Icon name="lock" className="text-[16px]" /> Сервер
          </span>
          <span className="font-label-caps text-label-caps text-on-surface-variant">{systemStatus.region}</span>
        </div>
      </div>
    </aside>
  );
}
