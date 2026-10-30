import { HandNote } from "@/components/daftar/HandNote";
import { cn } from "@/lib/cn";
import { getT } from "@/lib/i18n/server";

const steps = ["talk", "count", "confirm"] as const;

export async function LandingSteps() {
  const t = await getT();
  return (
    <section id="chi-tavr" className="scroll-mt-6">
      <h2 className="font-display text-[28px] leading-tight font-extrabold tracking-[-0.02em] lg:text-[36px]">{t("landing.steps.title")}</h2>
      <HandNote className="mt-1 inline-block -rotate-1 text-[22px] lg:text-[24px]">{t("landing.steps.note")}</HandNote>
      <ol className="mt-6 grid grid-cols-1 gap-3.5 md:grid-cols-3 lg:gap-5">
        {steps.map((step, index) => (
          <li
            key={step}
            className={cn(
              "flex items-start gap-3.5 rounded-card border-[1.5px] border-ink px-5 py-5 shadow-hard",
              index === steps.length - 1 ? "bg-marker" : "bg-card",
            )}
          >
            <span aria-hidden className="flex size-9 flex-none items-center justify-center rounded-full bg-ink font-display text-base font-bold text-marker">
              {index + 1}
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold">{t(`landing.steps.${step}.title`)}</h3>
              <p className={cn("mt-1 text-sm", index === steps.length - 1 ? "text-[#4a4416]" : "text-ink-2")}>{t(`landing.steps.${step}.note`)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
