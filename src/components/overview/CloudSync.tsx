import { Icon } from "@/components/ui/Icon";
import { branchesCount } from "@/data/overview";

export function CloudSyncBanner() {
  return (
    <div className="flex items-center justify-between rounded-xl bg-primary-container p-space-md text-on-primary-container">
      <div className="flex items-center gap-space-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest/20">
          <Icon name="backup" className="text-xl" />
        </div>
        <div>
          <p className="font-headline-sm text-headline-sm leading-tight font-bold">Ҳамоҳангсозии абрӣ</p>
          <p className="font-body-sm text-body-sm opacity-90">Ҳамаи {branchesCount} филиал баробар сабт мешаванд</p>
        </div>
      </div>
      <Icon name="check_circle" className="text-xl opacity-80" />
    </div>
  );
}

export function CloudSyncPill() {
  return (
    <div className="flex justify-center pb-2">
      <div className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-1.5 font-label-caps text-label-caps text-on-surface-variant">
        <span className="h-2 w-2 animate-ping rounded-full bg-primary" />
        <Icon name="cloud_done" className="text-[14px] text-primary" />
        <span className="font-medium">Ҳамоҳангсозии абрӣ: Фаъол</span>
      </div>
    </div>
  );
}
