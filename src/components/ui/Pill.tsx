import type { ReactNode } from "react";
import type { Tone } from "@/data/types";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const tones: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary-container text-on-secondary-container",
  tertiary: "bg-tertiary-fixed text-on-tertiary-fixed",
  warning: "bg-tertiary-fixed/60 text-tertiary",
  error: "bg-error/10 text-error",
  neutral: "bg-surface-container-high text-on-surface-variant",
};

const dots: Record<Tone, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  tertiary: "bg-tertiary",
  warning: "bg-tertiary",
  error: "bg-error",
  neutral: "bg-outline",
};

type PillProps = {
  children: ReactNode;
  tone?: Tone;
  shape?: "rounded" | "full";
  size?: "caps" | "text";
  icon?: string;
  dot?: boolean;
  className?: string;
};

export function Pill({
  children,
  tone = "neutral",
  shape = "rounded",
  size = "caps",
  icon,
  dot = false,
  className,
}: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 px-2 py-0.5 whitespace-nowrap",
        shape === "full" ? "rounded-full" : "rounded-sm",
        size === "caps" ? "font-label-caps text-label-caps font-semibold" : "font-body-sm text-body-sm font-medium",
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dots[tone])} />}
      {icon && <Icon name={icon} className="text-xs" />}
      {children}
    </span>
  );
}
