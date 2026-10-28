import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type CardProps = ComponentPropsWithoutRef<"div"> & {
  shadow?: "none" | "sm" | "md" | "lg";
};

const shadows = {
  none: "",
  sm: "shadow-hard-sm",
  md: "shadow-hard",
  lg: "shadow-hard-lg",
};

export function Card({ shadow = "md", className, ...props }: CardProps) {
  return <div className={cn("border-[1.5px] border-ink bg-card", shadows[shadow], className)} {...props} />;
}
