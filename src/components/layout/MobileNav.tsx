"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { appMobileNav, type NavItem } from "@/data/navigation";

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-[48px] min-w-[56px] flex-col items-center justify-center py-1 transition-colors ${
        active ? "font-bold text-primary" : "text-on-surface-variant"
      }`}
    >
      <Icon name={item.icon} className="text-[24px]" />
      {item.href === "/app/debts" && (
        <span className="absolute top-1 right-2.5 h-2 w-2 rounded-full bg-error ring-2 ring-surface-container-lowest" />
      )}
      <span className="mt-0.5 font-body-sm text-body-sm">{item.label}</span>
    </Link>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);
  const [first, second, third, fourth] = appMobileNav;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-surface-container-lowest/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_12px_rgba(0,0,0,0.05)] backdrop-blur-xl lg:hidden">
      <div className="flex h-20 items-end justify-around px-space-xs pb-1">
        <NavLink item={first} active={isActive(first.href)} />
        <NavLink item={second} active={isActive(second.href)} />
        <div className="relative -top-3 flex min-w-[64px] flex-col items-center justify-center">
          <Link
            href="/app"
            aria-label="Сабти нав"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed shadow-[0_4px_16px_rgba(156,100,0,0.35)] transition-transform active:scale-95"
          >
            <Icon name="mic" className="text-[30px] font-bold" />
          </Link>
          <span className="mt-1 text-center font-label-caps text-label-caps font-bold whitespace-nowrap text-tertiary">
            Сабти нав
          </span>
        </div>
        <NavLink item={third} active={isActive(third.href)} />
        <NavLink item={fourth} active={isActive(fourth.href)} />
      </div>
    </nav>
  );
}
