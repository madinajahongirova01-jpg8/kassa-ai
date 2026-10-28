import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2 py-0.5 font-label-caps text-label-caps font-semibold text-on-surface-variant",
        className,
      )}
    >
      <Icon name="info" className="text-[14px]" />
      Маълумоти намунавӣ
    </span>
  );
}
