import { HandNote } from "@/components/daftar/HandNote";
import { cn } from "@/lib/cn";

const steps = [
  { title: "Шумо гап мезанед", note: "ё матн менависед, ё акси чекро мефиристед" },
  { title: "Kassa ҳисоб мекунад", note: "Kassa суммаҳоро ҷудо мекунад ва чеки нав месозад" },
  { title: "Шумо тасдиқ мекунед", note: "сабт ба «Дафтари имрӯз» илова мешавад" },
];

export function LandingSteps() {
  return (
    <section id="chi-tavr" className="scroll-mt-6">
      <h2 className="font-display text-[28px] leading-tight font-extrabold tracking-[-0.02em] lg:text-[36px]">Се қадам — ва дафтар тайёр</h2>
      <HandNote className="mt-1 inline-block -rotate-1 text-[22px] lg:text-[24px]">ягон қалам лозим нашуд :)</HandNote>
      <ol className="mt-6 grid grid-cols-1 gap-3.5 md:grid-cols-3 lg:gap-5">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className={cn(
              "flex items-start gap-3.5 rounded-card border-[1.5px] border-ink px-5 py-5 shadow-hard",
              index === steps.length - 1 ? "bg-marker" : "bg-card",
            )}
          >
            <span aria-hidden className="flex size-9 flex-none items-center justify-center rounded-full bg-ink font-display text-base font-bold text-marker">
              {index + 1}
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold">{step.title}</h3>
              <p className={cn("mt-1 text-sm", index === steps.length - 1 ? "text-[#4a4416]" : "text-ink-2")}>{step.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
