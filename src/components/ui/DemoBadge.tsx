import { cn } from "@/lib/cn";

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border-[1.5px] border-dashed border-ink-3 bg-card px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-ink-2",
        className,
      )}
    >
      Маълумоти намунавӣ
    </span>
  );
}
