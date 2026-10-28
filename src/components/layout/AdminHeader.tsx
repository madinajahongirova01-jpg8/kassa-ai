import { Icon } from "@/components/ui/Icon";
import { adminUser, systemStatus } from "@/data/admin";

export function AdminHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-surface/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:left-72">
      <div className="flex h-16 items-center justify-between gap-space-xs px-gutter lg:hidden">
        <div className="flex min-w-0 items-center gap-space-sm">
          <div className="flex items-center gap-1.5 rounded-sm bg-surface-container-high px-2 py-1">
            <span className="font-headline-sm text-headline-sm text-primary">KASSA</span>
            <span className="rounded-sm bg-primary px-1 py-0.5 font-label-caps text-label-caps font-semibold text-on-primary">
              TJ-HQ
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-secondary-container/60 px-2 py-0.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            <span className="font-label-caps text-label-caps text-on-secondary-fixed-variant">{systemStatus.uptime}</span>
          </div>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
          <Icon name="person" className="text-[18px] text-on-primary" />
        </div>
      </div>

      <div className="hidden h-16 items-center justify-between px-8 lg:flex">
        <div className="flex max-w-md flex-1 items-center gap-4">
          <div className="relative flex w-full items-center">
            <Icon name="search" className="pointer-events-none absolute left-3 text-[20px] text-on-surface-variant" />
            <input
              type="text"
              placeholder="Ҷустуҷӯи тиҷоратҳо, сабтҳои овозӣ ё ID..."
              className="w-full rounded-lg border-0 bg-surface-container-lowest py-2 pr-4 pl-10 font-body-sm text-body-sm text-on-surface shadow-[0_1px_3px_rgba(15,42,35,0.04)] placeholder:text-on-surface-variant/60 focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-4 rounded-lg bg-surface-container-low px-3 py-1.5 xl:flex">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="font-body-sm text-body-sm text-on-surface-variant">Ҳолат:</span>
              <span className="font-tabular-ledger text-tabular-ledger text-primary">{systemStatus.uptime}</span>
            </div>
            <div className="h-3.5 w-px bg-outline-variant/40" />
            <div className="flex items-center gap-2">
              <Icon name="memory" className="text-[16px] text-on-surface-variant" />
              <span className="font-body-sm text-body-sm text-on-surface-variant">CPU:</span>
              <span className="font-tabular-ledger text-tabular-ledger text-on-surface">{systemStatus.cpu}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Огоҳиномаҳо"
              className="relative rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <Icon name="notifications" className="text-[22px]" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error" />
            </button>
            <div className="h-6 w-px bg-outline-variant/30" />
            <div className="flex items-center gap-3 pl-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                <Icon name="person" className="text-[18px] text-on-primary" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-headline-sm text-body-md leading-tight font-semibold text-on-surface">
                  {adminUser.name}
                </span>
                <span className="font-label-caps text-label-caps text-on-surface-variant">{adminUser.role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
