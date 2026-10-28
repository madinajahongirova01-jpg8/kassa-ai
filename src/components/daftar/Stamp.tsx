import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const tones = {
  pen: "border-pen text-pen",
  green: "border-green text-green",
};

type StampProps = {
  children: ReactNode;
  tone?: keyof typeof tones;
  size?: "lg" | "sm";
  className?: string;
};

export function Stamp({ children, tone = "pen", size = "lg", className }: StampProps) {
  return (
    <span
      className={cn(
        "inline-block -rotate-13 bg-white/55 font-display font-extrabold tracking-[0.08em] whitespace-nowrap opacity-85",
        tones[tone],
        size === "lg" ? "rounded-[10px] border-3 px-3 py-1.5 text-[15px]" : "rounded-lg border-[2.5px] px-2 py-1 text-[11px]",
        className,
      )}
    >
      {children}
    </span>
  );
}
