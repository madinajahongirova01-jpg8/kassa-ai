import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { currentBusiness } from "@/data/business";

export function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-surface/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:left-72">
      <div className="flex h-16 items-center justify-between gap-space-sm px-margin lg:hidden">
        <button
          type="button"
          className="flex min-h-[44px] max-w-[200px] items-center gap-space-xs rounded-lg px-space-xs py-1 text-left transition-colors active:bg-surface-container"
        >
          <div className="flex min-w-0 flex-col">
            <span className="font-label-caps text-label-caps font-bold tracking-wider text-primary uppercase">
              Kassa AI
            </span>
            <span className="truncate font-headline-sm text-body-md font-bold text-on-surface">
              {currentBusiness.name}
            </span>
          </div>
          <Icon name="expand_more" className="shrink-0 text-[20px] text-outline" />
        </button>
        <div className="flex items-center gap-space-xs">
          <button
            type="button"
            aria-label="Огоҳиномаҳо"
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors active:bg-surface-container"
          >
            <Icon name="notifications" className="text-[22px]" />
            <span className="absolute top-2 right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error px-1 font-body-sm text-[10px] leading-none font-bold text-on-error">
              {currentBusiness.notifications}
            </span>
          </button>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
            <Icon name="person" className="text-[18px] text-on-primary" />
          </div>
        </div>
      </div>

      <div className="hidden h-16 items-center justify-between px-space-lg lg:flex">
        <div className="flex w-96 items-center gap-space-md">
          <div className="relative flex w-full items-center">
            <Icon name="search" className="pointer-events-none absolute left-space-sm text-xl text-outline" />
            <input
              type="text"
              placeholder="Ҷустуҷӯи насия, амалиёт ва муштарӣ..."
              className="w-full rounded-lg bg-surface-container-low py-1.5 pr-space-md pl-9 font-body-sm text-body-sm text-on-surface outline-none placeholder:text-outline focus:bg-surface-container-lowest"
            />
            <Icon name="mic" className="pointer-events-none absolute right-space-sm text-lg text-outline" />
          </div>
        </div>
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-xs rounded-lg bg-surface-container px-space-sm py-1.5 font-body-sm text-body-sm text-on-surface-variant">
            <Icon name="calendar_today" className="text-base" />
            <span>{currentBusiness.today}</span>
          </div>
          <button
            type="button"
            aria-label="Огоҳиномаҳо"
            className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <Icon name="notifications" className="text-xl" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-tertiary-container font-label-caps text-label-caps font-bold text-on-tertiary-container">
              {currentBusiness.notifications}
            </span>
          </button>
          <Link
            href="/app/new"
            className="flex items-center gap-space-xs rounded-lg bg-tertiary-container px-space-md py-2 font-headline-sm text-headline-sm font-bold text-on-tertiary-container shadow-sm transition-opacity hover:opacity-95"
          >
            <Icon name="add" className="text-lg" />
            <span>Сабти нав</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
