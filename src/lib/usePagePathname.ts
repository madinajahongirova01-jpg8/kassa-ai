"use client";

import { usePathname } from "next/navigation";
import { stripLocalePrefix } from "@/lib/i18n/config";

// Pages are prerendered under an internal /tg|ru|en prefix while the browser URL has none.
// Stripping it gives the same pathname on the server and in the browser, so nav state hydrates cleanly.
export function usePagePathname() {
  return stripLocalePrefix(usePathname());
}
