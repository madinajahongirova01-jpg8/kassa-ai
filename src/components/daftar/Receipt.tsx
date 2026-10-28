import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Receipt({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("receipt-tape font-mono text-ink drop-shadow-[0_14px_22px_rgba(27,35,64,0.16)]", className)}>
      {children}
    </div>
  );
}

export function ReceiptDivider({ className }: { className?: string }) {
  return <div className={cn("border-t-[1.5px] border-dashed border-line-strong", className)} />;
}
