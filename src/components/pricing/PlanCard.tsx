import { HandNote } from "@/components/daftar/HandNote";
import type { Plan } from "@/data/pricing";
import { cn } from "@/lib/cn";
import type { Translate } from "@/lib/i18n/translate";

export function PlanCard({ plan, t }: { plan: Plan; t: Translate }) {
  const price = t(`pricing.plans.${plan.id}.price`);
  const numeric = /^\d+$/.test(price);
  return (
    <article
      className={cn(
        "relative flex flex-col rounded-sheet border-[1.5px] border-ink p-5 shadow-hard lg:p-6",
        plan.main ? "bg-marker" : "bg-card",
      )}
    >
      {plan.main && (
        <span className="absolute -top-3.5 right-4 rotate-3 rounded-lg border-[1.5px] border-ink bg-card px-2.5 py-0.5 font-hand text-xl font-semibold text-pen">
          {t("pricing.mainBadge")}
        </span>
      )}
      <h2 className="font-display text-2xl font-extrabold">{t(`pricing.plans.${plan.id}.name`)}</h2>
      <p className={cn("mt-1 text-sm", plan.main ? "text-[#4a4416]" : "text-ink-2")}>{t(`pricing.plans.${plan.id}.audience`)}</p>
      <div className="mt-6 border-t-[1.5px] border-dashed border-ink/30 pt-5">
        <div className={cn("font-display leading-none font-extrabold tracking-[-0.03em]", numeric ? "text-[56px]" : "text-[34px]")}>{price}</div>
        <div className="mt-2 font-mono text-sm font-semibold">{t(`pricing.plans.${plan.id}.period`)}</div>
        {numeric && <div className={cn("mt-1 text-xs", plan.main ? "text-[#4a4416]" : "text-ink-3")}>{t("pricing.planned")}</div>}
      </div>
      {plan.id === "ogoz" && <HandNote className="mt-4 -rotate-2 text-xl">{t("pricing.tryNote")}</HandNote>}
    </article>
  );
}
