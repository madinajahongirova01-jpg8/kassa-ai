"use client";

import { useSyncExternalStore } from "react";
import { businessTime, businessToday } from "@/lib/dates";
import { formatDayMonth } from "@/lib/format";

function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, 15_000);
  return () => window.clearInterval(timer);
}

function snapshot() {
  const now = new Date();
  return `${formatDayMonth(businessToday(now))} · ${businessTime(now)}`;
}

export function useBusinessNow() {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}
