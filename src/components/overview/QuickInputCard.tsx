import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Waveform } from "@/components/voice/Waveform";
import { quickInput } from "@/data/overview";

export function QuickInputCard() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-xs">
      <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary-fixed/30 blur-2xl" />
      <div>
        <div className="flex items-center justify-between gap-space-sm pb-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-container text-on-primary">
              <Icon name="auto_awesome" className="text-base" />
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface">Тез нависед ё гап занед</span>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 font-label-caps text-label-caps font-semibold tracking-wider text-primary uppercase">
            {quickInput.engine}
          </span>
        </div>
        <div className="relative rounded-xl bg-surface-container-low p-space-md">
          <div className="flex items-start gap-space-sm">
            <Link
              href="/app/new"
              aria-label="Овозро фаъол кунед"
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-md transition-transform hover:scale-105 active:scale-95"
            >
              <Icon name="mic" className="text-2xl" />
              <span className="absolute inset-0 animate-ping rounded-full bg-tertiary-fixed-dim/40 opacity-75" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between pb-1">
                <span className="font-label-caps text-label-caps tracking-wider text-outline uppercase">
                  Сабти овозӣ (Транскрипт)
                </span>
                <div className="flex h-3 items-center gap-1 px-2">
                  <span className="h-2 w-1 animate-pulse rounded-full bg-primary" />
                  <span className="h-3 w-1 animate-pulse rounded-full bg-primary [animation-delay:120ms]" />
                  <span className="h-2 w-1 animate-pulse rounded-full bg-tertiary [animation-delay:240ms]" />
                  <span className="h-3.5 w-1 animate-pulse rounded-full bg-primary [animation-delay:80ms]" />
                  <span className="h-1.5 w-1 animate-pulse rounded-full bg-primary-container [animation-delay:180ms]" />
                </div>
              </div>
              <p className="font-body-lg text-body-lg leading-relaxed font-medium text-on-surface italic">
                «{quickInput.transcript}»
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-md">
        <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-outline">
          <Icon name="verified" className="text-base text-primary" />
          <span>{quickInput.detected}</span>
        </div>
        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            className="px-space-md py-2 font-body-md text-body-md text-outline transition-colors hover:text-on-surface"
          >
            Тоза кардан
          </button>
          <Link
            href="/app/new"
            className="flex items-center gap-space-xs rounded-lg bg-primary px-space-md py-2 font-headline-sm text-headline-sm text-on-primary shadow-sm transition-all hover:bg-primary/95"
          >
            <Icon name="psychology" className="text-lg" />
            Таҳлили AI
          </Link>
        </div>
      </div>
    </div>
  );
}

export function QuickInputCompact() {
  return (
    <section className="rounded-xl bg-surface-container-lowest p-space-md shadow-[0_2px_10px_rgba(15,42,35,0.04)]">
      <div className="mb-space-sm flex items-center justify-between gap-space-xs">
        <div className="flex min-w-0 items-center gap-space-xs">
          <Icon name="graphic_eq" filled className="text-[20px] text-primary" />
          <span className="truncate font-headline-sm text-body-md font-bold text-on-surface">Тез нависед ё гап занед</span>
        </div>
        <span className="shrink-0 rounded-full bg-secondary-container px-2 py-0.5 font-label-caps text-label-caps font-semibold tracking-wide text-on-secondary-container">
          {quickInput.engineShort}
        </span>
      </div>
      <div className="flex items-center gap-space-sm rounded-lg bg-surface-container-low p-space-sm">
        <Link
          href="/app/new"
          aria-label="Оғози сабти овозӣ"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_4px_12px_rgba(7,100,78,0.25)] transition-transform active:scale-95"
        >
          <Icon name="mic" className="text-[24px]" />
        </Link>
        <Waveform size="sm" className="h-7 flex-1 justify-start px-1" />
        <span className="shrink-0 font-label-caps text-label-caps font-bold text-primary uppercase">Зинда</span>
      </div>
      <div className="mt-space-sm rounded-lg bg-surface-container p-space-sm">
        <p className="font-body-md text-body-sm leading-relaxed text-on-surface-variant italic">«{quickInput.transcript}»</p>
      </div>
      <div className="mt-space-sm flex justify-end">
        <Link
          href="/app/new"
          className="flex items-center gap-space-xs rounded-lg bg-primary px-space-md py-2.5 font-headline-sm text-body-sm font-semibold text-on-primary shadow-xs transition-opacity active:opacity-90"
        >
          <Icon name="auto_awesome" className="text-[18px]" />
          Таҳлили AI
        </Link>
      </div>
    </section>
  );
}
