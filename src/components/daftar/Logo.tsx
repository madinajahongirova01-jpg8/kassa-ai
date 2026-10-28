import Link from "next/link";
import { cn } from "@/lib/cn";

export function LogoMark({ size = "lg" }: { size?: "lg" | "sm" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 -rotate-4 items-center justify-center bg-ink font-display font-extrabold text-marker",
        size === "lg" ? "size-[38px] rounded-[10px] text-[17px]" : "size-8 rounded-[9px] text-[15px]",
      )}
    >
      K
    </span>
  );
}

export function Logo({ href = "/app" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-ink hover:text-ink">
      <LogoMark />
      <span className="font-display text-lg font-extrabold">
        Kassa <span className="text-pen">AI</span>
      </span>
    </Link>
  );
}
