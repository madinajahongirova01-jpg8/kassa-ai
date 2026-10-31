"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Card } from "@/components/daftar/Card";
import { useT } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { browserStorage, onboardingSteps, readDismissed, showOnboarding, writeDismissed, type OnboardingProgress } from "@/lib/onboarding";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function StartCard({ progress }: { progress: OnboardingProgress }) {
  const t = useT();
  const stored = useSyncExternalStore(subscribe, () => readDismissed(browserStorage()), () => true);
  const [closed, setClosed] = useState(false);
  if (!showOnboarding(progress, stored || closed)) return null;

  function close() {
    writeDismissed(browserStorage());
    setClosed(true);
    listeners.forEach((listener) => listener());
  }

  return (
    <Card role="region" className="flex flex-col gap-4 rounded-sheet px-[18px] py-5 lg:px-[22px]" aria-labelledby="start-card-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="start-card-title" className="font-display text-[19px] font-bold">
          {t("today.start.title")}
        </h2>
        <button type="button" onClick={close} className="shrink-0 text-sm font-semibold text-ink-2 hover:text-pen">
          ✕ {t("common.close")}
        </button>
      </div>
      <ol className="grid gap-3 lg:grid-cols-3">
        {onboardingSteps(progress).map((step, index) => (
          <li key={step.id} className="flex gap-3 rounded-tile border-[1.5px] border-ink bg-card px-3.5 py-3">
            <span
              aria-hidden
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink font-display font-bold",
                step.done ? "bg-green text-card" : "bg-card text-ink",
              )}
            >
              {step.done ? "✓" : index + 1}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <Link href={step.href} className={cn("font-display text-base font-bold text-pen underline", step.done && "text-ink-2 line-through")}>
                {t(`today.start.${step.id}.title`)}
              </Link>
              <span className="text-sm text-ink-2">{t(`today.start.${step.id}.text`)}</span>
              {step.done && <span className="text-xs font-semibold text-green">✓ {t("today.start.done")}</span>}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
