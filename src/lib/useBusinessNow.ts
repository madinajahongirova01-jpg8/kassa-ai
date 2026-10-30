"use client";

import { useCallback, useSyncExternalStore } from "react";
import { businessTime, businessToday } from "@/lib/dates";
import { formatDayMonth } from "@/lib/format";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, 15_000);
  return () => window.clearInterval(timer);
}

export function useBusinessNow(locale: Locale = DEFAULT_LOCALE) {
  const snapshot = useCallback(() => {
    const now = new Date();
    return `${formatDayMonth(businessToday(now), locale)} · ${businessTime(now)}`;
  }, [locale]);
  return useSyncExternalStore(subscribe, snapshot, () => null);
}
