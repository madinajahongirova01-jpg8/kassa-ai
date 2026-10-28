import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export function Marker({ className, ...props }: ComponentPropsWithoutRef<"span">) {
  return <span className={cn("marker", className)} {...props} />;
}
