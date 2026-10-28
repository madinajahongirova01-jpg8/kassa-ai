"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNav } from "@/data/navigation";
import { cn } from "@/lib/cn";
import { isNavActive } from "@/lib/nav";

export function NavPill() {
  const pathname = usePathname();
  return (
    <nav aria-label="Менюи асосӣ" className="flex gap-1.5 rounded-full border-[1.5px] border-ink bg-card p-1">
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
