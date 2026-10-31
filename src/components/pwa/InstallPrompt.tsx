"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { Card } from "@/components/daftar/Card";
import { useT } from "@/components/i18n/I18nProvider";
import { currentInstallMode, dismissInstall, promptInstall, subscribeInstall } from "@/lib/installPrompt";
import { PWA_ICONS } from "@/lib/pwa";

export function InstallPrompt() {
  const t = useT();
  const mode = useSyncExternalStore(subscribeInstall, currentInstallMode, () => null);
  if (!mode) return null;

  return (
    <Card shadow="sm" role="region" aria-label={t("pwa.installTitle")} className="flex items-start gap-3 rounded-tile px-3.5 py-3">
      <Image src={PWA_ICONS.small} alt="" width={40} height={40} className="size-10 shrink-0 rounded-[10px] border border-line" />
      <div className="min-w-0 flex-1">
        <div className="font-display text-sm font-bold">{t("pwa.installTitle")}</div>
        <p className="mt-0.5 text-[13px] leading-snug text-ink-2">{mode === "ios" ? t("pwa.iosSteps") : t("pwa.installText")}</p>
        {mode === "prompt" && (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="mt-2 flex h-9 items-center rounded-tile border-[1.5px] border-ink bg-marker px-3.5 font-display text-xs font-bold text-ink shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            {t("pwa.install")}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={dismissInstall}
        aria-label={t("pwa.close")}
        className="-mt-1 -mr-1.5 flex size-9 shrink-0 items-center justify-center rounded-full text-xl leading-none text-ink-2 hover:text-ink"
      >
        ×
      </button>
    </Card>
  );
}
