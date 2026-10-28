import { cn } from "@/lib/cn";

export function Avatar({ initials, size = "lg" }: { initials: string; size?: "lg" | "sm" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink bg-marker font-bold text-ink",
        size === "lg" ? "size-10 text-[13px]" : "size-9 text-xs",
      )}
    >
      {initials}
    </span>
  );
}
