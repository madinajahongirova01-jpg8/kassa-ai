import { HandNote } from "@/components/daftar/HandNote";
import type { Plan } from "@/data/pricing";
import { cn } from "@/lib/cn";

export function PlanCard({ plan }: { plan: Plan }) {
  const numeric = /^\d+$/.test(plan.price);
  return (
    <article
      className={cn(
        "relative flex flex-col rounded-sheet border-[1.5px] border-ink p-5 shadow-hard lg:p-6",
        plan.main ? "bg-marker" : "bg-card",
      )}
    >
      {plan.main && (
        <span className="absolute -top-3.5 right-4 rotate-3 rounded-lg border-[1.5px] border-ink bg-card px-2.5 py-0.5 font-hand text-xl font-semibold text-pen">
          тарофаи асосӣ
        </span>
      )}
      <h2 className="font-display text-2xl font-extrabold">{plan.name}</h2>
      <p className={cn("mt-1 text-sm", plan.main ? "text-[#4a4416]" : "text-ink-2")}>{plan.audience}</p>
      <div className="mt-6 border-t-[1.5px] border-dashed border-ink/30 pt-5">
        <div className={cn("font-display leading-none font-extrabold tracking-[-0.03em]", numeric ? "text-[56px]" : "text-[34px]")}>
          {plan.price}
        </div>
        <div className="mt-2 font-mono text-sm font-semibold">{plan.period}</div>
      </div>
      {plan.id === "ogoz" && (
        <HandNote className="mt-4 -rotate-2 text-xl">аввал санҷед, баъд қарор диҳед</HandNote>
      )}
    </article>
  );
}
