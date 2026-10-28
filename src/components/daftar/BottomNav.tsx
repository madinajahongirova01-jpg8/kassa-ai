"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MicIcon } from "@/components/daftar/icons";
import { appNav } from "@/data/navigation";
import { cn } from "@/lib/cn";
import { isNavActive } from "@/lib/nav";

export function BottomNav() {
  const pathname = usePathname();
  const tabs = appNav.map((item) => {
    const active = isNavActive(pathname, item.href, "/app");
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn("flex flex-col items-center gap-1", active ? "text-ink" : "text-ink-2 hover:text-pen")}
      >
        <span className={cn("h-1 w-[22px] rounded-[2px]", active ? "bg-ink" : "bg-transparent")} />
        {item.label}
      </Link>
    );
  });

  return (
    <nav
      aria-label="Менюи асосӣ"
      className="fixed inset-x-0 bottom-0 z-40 border-t-[1.5px] border-ink bg-card pb-[env(safe-area-inset-bottom)] xl:hidden"
    >
      <div className="relative mx-auto flex h-[92px] max-w-[600px] items-center justify-around px-2 text-[11px] font-semibold">
        {tabs.slice(0, 2)}
        <span className="w-[78px]" />
        {tabs.slice(2)}
        <Link
          href="/app/new"
          aria-label="Гап занед"
          className="absolute top-[-34px] left-1/2 -ml-[38px] flex size-[76px] items-center justify-center rounded-full border-4 border-paper bg-pen text-card shadow-[0_10px_22px_rgba(45,75,216,0.45)] active:scale-95"
        >
          <MicIcon size={30} strokeWidth={2} />
        </Link>
      </div>
    </nav>
  );
}
