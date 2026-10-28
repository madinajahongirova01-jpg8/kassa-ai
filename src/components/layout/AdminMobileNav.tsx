"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { adminMobileNav } from "@/data/navigation";
import { cn } from "@/lib/cn";
import { isNavActive } from "@/lib/nav";

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 z-50 w-full bg-surface/85 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_12px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center justify-around px-space-xs">
        {adminMobileNav.map((item) => {
          const active = isNavActive(pathname, item.href, "/admin");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 transition-colors",
                active ? "font-semibold text-primary" : "text-on-surface-variant hover:text-on-surface",
              )}
            >
              <Icon name={item.icon} className="text-[22px]" />
              <span className="font-label-caps text-label-caps">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
