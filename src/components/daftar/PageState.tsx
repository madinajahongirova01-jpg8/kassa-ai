"use client";

import { HandNote } from "@/components/daftar/HandNote";
import { useT } from "@/components/i18n/I18nProvider";

/** Shown while a page reads its data from the API. */
export function PageLoading({ text }: { text: string }) {
  return (
    <div role="status" className="flex min-h-[320px] items-center justify-center">
      <HandNote tone="muted" className="animate-pulse text-center text-2xl">
        {text}
      </HandNote>
    </div>
  );
}

/** Shown when the API could not be reached or answered with an error. */
export function PageError({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <div role="alert" className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
      <HandNote tone="red" className="text-[26px] leading-tight">
        {t("common.error.title")}
      </HandNote>
      <p className="text-sm text-ink-2">{t("common.error.text")}</p>
      <button
        type="button"
        onClick={onRetry}
        className="h-[46px] rounded-tile border-[1.5px] border-ink bg-card px-5 text-sm font-semibold text-ink hover:text-pen"
      >
        {t("common.error.retry")}
      </button>
    </div>
  );
}
