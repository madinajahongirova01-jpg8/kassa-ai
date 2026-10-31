"use client";

import { useEffect, useState } from "react";
import { useLocale, useT } from "@/components/i18n/I18nProvider";
import { businessTime, businessToday } from "@/lib/dates";
import { formatDayMonth } from "@/lib/format";
import { receiptImageData, renderReceiptPng } from "@/lib/receiptImage";
import { browserShareEnv, receiptFileName, shareOrDownload } from "@/lib/receiptShare";
import type { SabtEntry } from "@/lib/sabt";

type Prepared = { file: File } | { error: true } | null;

async function readBusinessName(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    if (!response.ok) return null;
    const body: { user?: { businessName?: unknown; name?: unknown } } = await response.json();
    const { businessName, name } = body.user ?? {};
    return typeof businessName === "string" && businessName.trim() ? businessName : typeof name === "string" && name.trim() ? name : null;
  } catch {
    return null;
  }
}

export function ReceiptImageButton({ entries, profit }: { entries: SabtEntry[]; profit: number }) {
  const t = useT();
  const locale = useLocale();
  const [prepared, setPrepared] = useState<Prepared>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const now = new Date();
    const day = businessToday(now);
    const when = `${formatDayMonth(day, locale)} · ${businessTime(now)}`;
    readBusinessName()
      .then((businessName) => renderReceiptPng(receiptImageData(entries, profit, t, locale, businessName, when)))
      .then((blob) => active && setPrepared({ file: new File([blob], receiptFileName(day), { type: "image/png" }) }))
      .catch(() => active && setPrepared({ error: true }));
    return () => {
      active = false;
    };
  }, [entries, profit, t, locale]);

  async function save() {
    if (prepared === null || !("file" in prepared)) {
      setStatus(t("sabt.image.failed"));
      return;
    }
    setStatus(null);
    try {
      const outcome = await shareOrDownload(prepared.file, t("sabt.image.shareTitle"), browserShareEnv());
      if (outcome !== "cancelled") setStatus(t(outcome === "shared" ? "sabt.image.shared" : "sabt.image.downloaded"));
    } catch {
      setStatus(t("sabt.image.failed"));
    }
  }

  const ready = prepared !== null && "file" in prepared;
  return (
    <div className="mt-3 flex flex-col gap-2">
      <button
        type="button"
        onClick={save}
        disabled={prepared === null}
        className="flex h-[50px] w-full items-center justify-center gap-2 rounded-card border-[1.5px] border-ink bg-card text-[15px] font-semibold text-ink shadow-hard-sm hover:text-pen active:translate-x-px active:translate-y-px active:shadow-none disabled:text-ink-3 disabled:shadow-none"
      >
        <span aria-hidden>📷</span>
        {prepared === null ? t("sabt.image.preparing") : t("sabt.image.button")}
      </button>
      {(status || (prepared !== null && !ready)) && (
        <p role="status" className="text-center text-sm font-semibold text-ink-2">
          {status ?? t("sabt.image.failed")}
        </p>
      )}
    </div>
  );
}
