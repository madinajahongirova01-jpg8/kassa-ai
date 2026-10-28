import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const tapes = {
  yellow: "bg-[rgba(255,228,92,0.8)]",
  red: "bg-[rgba(214,69,61,0.35)]",
  blue: "bg-[rgba(45,75,216,0.25)]",
};

export type StickerTape = keyof typeof tapes;

type StickerProps = {
  children: ReactNode;
  tape?: StickerTape;
  rotate?: number;
  tapeRotate?: number;
  size?: "lg" | "sm";
  className?: string;
};

export function Sticker({ children, tape = "yellow", rotate = 0, tapeRotate = 0, size = "lg", className }: StickerProps) {
  return (
    <div
      style={{ transform: `rotate(${rotate}deg)` }}
      className={cn(
        "relative rounded-xl border-[1.5px] border-ink bg-card",
        size === "lg" ? "px-4 pt-[18px] pb-3.5" : "px-3.5 pt-3.5 pb-2.5",
        className,
      )}
    >
      <span
        aria-hidden
        style={{ transform: `rotate(${tapeRotate}deg)` }}
        className={cn(
          "absolute left-1/2",
          size === "lg" ? "-top-[9px] -ml-[35px] h-[18px] w-[70px]" : "-top-2 -ml-[30px] h-4 w-[60px]",
          tapes[tape],
        )}
      />
      {children}
    </div>
  );
}
