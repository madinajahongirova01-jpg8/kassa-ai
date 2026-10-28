import { cn } from "@/lib/cn";

const teeth = Array.from({ length: 40 }, (_, i) => `L${i * 10 + 10},${i % 2 === 0 ? 0 : 6}`).join(" ");

export function ZigzagEdge({ className }: { className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden leading-none text-surface", className)}>
      <svg className="h-2 w-full fill-current" preserveAspectRatio="none" viewBox="0 0 400 6" aria-hidden="true">
        <path d={`M0,6 ${teeth} L400,6 Z`} />
      </svg>
    </div>
  );
}
