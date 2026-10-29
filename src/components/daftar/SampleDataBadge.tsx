"use client";

import { usePathname } from "next/navigation";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { liveDataRoutes } from "@/data/navigation";
import { isNavActive } from "@/lib/nav";

export function SampleDataBadge() {
  const pathname = usePathname();
  if (liveDataRoutes.some((href) => isNavActive(pathname, href, "/app"))) return null;
  return <DemoBadge />;
}
