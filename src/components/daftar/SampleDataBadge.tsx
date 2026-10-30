"use client";

import { DemoBadge } from "@/components/ui/DemoBadge";
import { liveDataRoutes } from "@/data/navigation";
import { isNavActive } from "@/lib/nav";
import { usePagePathname } from "@/lib/usePagePathname";

export function SampleDataBadge() {
  const pathname = usePagePathname();
  if (liveDataRoutes.some((href) => isNavActive(pathname, href, "/app"))) return null;
  return <DemoBadge />;
}
