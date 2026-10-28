import { cn } from "@/lib/cn";

type Bar = { height: string; color: string; delay?: string };

const largeBars: Bar[] = [
  { height: "h-4", color: "bg-primary-container" },
  { height: "h-8", color: "bg-primary-container", delay: "[animation-delay:150ms]" },
  { height: "h-14", color: "bg-tertiary-container", delay: "[animation-delay:300ms]" },
  { height: "h-10", color: "bg-primary", delay: "[animation-delay:75ms]" },
  { height: "h-6", color: "bg-primary-container", delay: "[animation-delay:200ms]" },
  { height: "h-16", color: "bg-tertiary-container", delay: "[animation-delay:400ms]" },
  { height: "h-12", color: "bg-primary", delay: "[animation-delay:120ms]" },
  { height: "h-5", color: "bg-primary-container", delay: "[animation-delay:250ms]" },
  { height: "h-11", color: "bg-tertiary-container", delay: "[animation-delay:350ms]" },
  { height: "h-14", color: "bg-primary", delay: "[animation-delay:180ms]" },
  { height: "h-8", color: "bg-primary-container", delay: "[animation-delay:90ms]" },
  { height: "h-4", color: "bg-primary-container" },
];

const smallBars: Bar[] = [
  { height: "h-2", color: "bg-primary", delay: "[animation-duration:0.8s]" },
  { height: "h-3.5", color: "bg-primary", delay: "[animation-duration:0.6s]" },
  { height: "h-5", color: "bg-tertiary-container", delay: "[animation-duration:0.5s]" },
  { height: "h-3", color: "bg-primary", delay: "[animation-duration:0.7s]" },
  { height: "h-4", color: "bg-primary", delay: "[animation-duration:0.65s]" },
  { height: "h-2", color: "bg-primary", delay: "[animation-duration:0.9s]" },
];

export function Waveform({ size = "lg", className }: { size?: "lg" | "sm"; className?: string }) {
  const bars = size === "lg" ? largeBars : smallBars;
  return (
    <div className={cn("flex items-center justify-center", size === "lg" ? "gap-1.5" : "gap-0.5", className)}>
      {bars.map((bar, index) => (
        <span
          key={index}
          className={cn(
            "animate-pulse rounded-full",
            size === "lg" ? "w-1.5" : "w-1",
            bar.height,
            bar.color,
            bar.delay,
          )}
        />
      ))}
    </div>
  );
}
