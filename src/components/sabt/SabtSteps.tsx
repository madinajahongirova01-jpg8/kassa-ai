import { cn } from "@/lib/cn";

type Step = { title: string; note: string; done: boolean; active?: boolean };

export function SabtSteps({ steps }: { steps: Step[] }) {
  return (
    <ol className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:gap-3.5">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className={cn(
            "flex items-center gap-2.5 rounded-tile border-[1.5px] border-ink px-3.5 py-3",
            step.active ? "bg-marker" : "bg-card",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "flex size-[26px] flex-none items-center justify-center rounded-full text-[13px] font-bold",
              step.done ? "bg-green text-card" : "bg-ink text-marker",
            )}
          >
            {step.done ? "✓" : index + 1}
          </span>
          <div className="min-w-0">
            <div className="font-semibold">{step.title}</div>
            <div className={cn("text-xs", step.active ? "text-[#4a4416]" : "text-ink-2")}>{step.note}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
