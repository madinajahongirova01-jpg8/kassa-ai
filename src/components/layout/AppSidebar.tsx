"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { currentBusiness } from "@/data/business";
import { appSidebarNav } from "@/data/navigation";
import { isNavActive } from "@/lib/nav";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-full w-72 flex-col justify-between overflow-y-auto bg-inverse-surface text-inverse-on-surface no-scrollbar lg:flex">
      <div className="flex flex-col">
        <div className="flex items-center gap-space-sm p-space-md pb-space-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-on-primary">
            <Icon name="receipt_long" className="text-[20px]" />
          </div>
          <span className="font-headline-sm text-headline-sm font-bold text-surface-container-lowest">
            Kassa AI
          </span>
        </div>

        <div className="px-space-md pb-space-md">
          <div className="flex cursor-pointer items-center justify-between rounded-lg bg-on-surface-variant/40 p-space-sm">
            <div className="flex items-center gap-space-xs overflow-hidden">
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary-fixed" />
              <span className="truncate font-body-sm text-body-sm font-medium text-surface">
                {currentBusiness.name}
              </span>
            </div>
            <Icon name="unfold_more" className="shrink-0 text-base text-outline-variant" />
          </div>
        </div>

        <nav className="space-y-1 px-space-sm">
          {appSidebarNav.map((item) => {
            const active = isNavActive(pathname, item.href, "/app");
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center justify-between rounded-lg px-space-md py-space-sm transition-colors ${
                  active
                    ? "bg-primary-container font-semibold text-on-primary-container"
                    : "text-outline-variant hover:bg-on-surface-variant/30 hover:text-surface"
                }`}
              >
                <div className="flex items-center gap-space-md">
                  <Icon name={item.icon} className="text-xl" />
                  <span className="font-body-md text-body-md">{item.label}</span>
                </div>
                {item.href === "/app/debts" && (
                  <span className="rounded-sm bg-error/20 px-space-xs py-0.5 font-label-caps text-label-caps text-error-container">
                    {currentBusiness.activeDebt} смн
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-space-md p-space-md">
        <div className="flex cursor-pointer items-center justify-between rounded-xl bg-on-surface-variant/20 p-space-sm transition-colors hover:bg-on-surface-variant/30">
          <div className="flex items-center gap-space-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-sm">
              <Icon name="mic" className="text-xl" />
            </div>
            <div>
              <p className="font-label-caps text-label-caps uppercase text-outline-variant">
                Сабти овозӣ
              </p>
              <p className="font-body-sm text-body-sm font-semibold text-surface">
                Гуфтан ва навиштан
              </p>
            </div>
          </div>
          <Icon name="arrow_forward" className="text-base text-outline-variant" />
        </div>

        <div className="flex items-center justify-between pt-space-xs">
          <div className="flex items-center gap-space-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container font-body-sm text-body-sm font-bold text-on-primary-container">
              {currentBusiness.owner.initials}
            </div>
            <div>
              <p className="font-body-md text-body-md leading-tight font-semibold text-surface">
                {currentBusiness.owner.name}
              </p>
              <p className="font-body-sm text-body-sm leading-tight text-outline-variant">
                {currentBusiness.owner.role}
              </p>
            </div>
          </div>
          <Link href="/login" aria-label="Баромад" className="text-outline-variant hover:text-surface">
            <Icon name="logout" className="text-xl" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
