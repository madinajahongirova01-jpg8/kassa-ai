import Link from "next/link";
import type { ReactNode } from "react";
import { HandNote } from "@/components/daftar/HandNote";
import { Marker } from "@/components/daftar/Marker";
import { Sticker } from "@/components/daftar/Sticker";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { todayEntries, weekProfit } from "@/data/imruz";
import { cn } from "@/lib/cn";
import { formatSomoni } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { createPlural, createT } from "@/lib/i18n/translate";
import { daySummary, signedAmount } from "@/lib/imruz";

type FeatureProps = {
  href: string;
  tab: string;
  title: string;
  text: string;
  open: string;
  children: ReactNode;
};

function Feature({ href, tab, title, text, open, children }: FeatureProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-sheet border-[1.5px] border-ink bg-card p-5 text-ink shadow-hard transition-transform hover:-translate-y-0.5 hover:text-ink lg:p-6"
    >
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-card">{tab}</span>
        <DemoBadge />
      </span>
      <h3 className="mt-3 font-display text-xl font-bold">{title}</h3>
      <p className="mt-1 text-sm text-ink-2">{text}</p>
      <div className="mt-5 flex flex-1 flex-col justify-end">{children}</div>
      <span className="mt-4 text-sm font-semibold group-hover:text-pen">{open}</span>
    </Link>
  );
}

// The sample entries are Tajik sample data, so they are shown as they are in every language.
export async function LandingFeatures() {
  const locale = await getLocale();
  const t = createT(locale);
  const plural = createPlural(locale);
  const open = t("landing.features.open");
  const summary = daySummary(todayEntries);
  const best = Math.max(...weekProfit.map((day) => day.profit));

  return (
    <section id="imkoniyatho" className="scroll-mt-6">
      <h2 className="font-display text-[28px] leading-tight font-extrabold tracking-[-0.02em] lg:text-[36px]">{t("landing.features.title")}</h2>
      <p className="mt-2 max-w-[620px] text-ink-2">{t("landing.features.text")}</p>
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Feature href="/app" tab={t("nav.today")} title={t("landing.features.today.title")} text={t("landing.features.today.text")} open={open}>
          <div>
            <HandNote className="text-xl">{t("today.summary.lead")}</HandNote>
            <div className="font-display text-[34px] leading-none font-extrabold tracking-[-0.03em]">
              <Marker className="px-1">{formatSomoni(summary.profit, { sign: true, unit: false, locale })}</Marker>
            </div>
            <div className="mt-1.5 font-display text-sm font-bold">{t("report.gained")}</div>
          </div>
        </Feature>

        <Feature
          href="/app/transactions"
          tab={t("nav.ledger")}
          title={t("landing.features.ledger.title")}
          text={t("landing.features.ledger.text")}
          open={open}
        >
          <div className="font-mono text-[12.5px]">
            {todayEntries.slice(0, 3).map((entry, index) => (
              <div key={entry.id} className={cn("flex gap-2 py-1.5", index < 2 && "border-b border-dotted border-line")}>
                <span className="text-ink-3">{entry.time}</span>
                <span className="min-w-0 flex-1 truncate">{entry.shortTitle}</span>
                <span className={cn("font-bold", signedAmount(entry) >= 0 ? "text-green" : "text-red")}>
                  {formatSomoni(signedAmount(entry), { sign: true, unit: false, locale })}
                </span>
              </div>
            ))}
          </div>
        </Feature>

        <Feature href="/app/debts" tab={t("nav.debts")} title={t("landing.features.debts.title")} text={t("landing.features.debts.text")} open={open}>
          <Sticker tape="red" rotate={-1.5} tapeRotate={-3} size="sm" alert className="mt-2">
            <div className="text-sm font-bold">{t("landing.features.debts.overdue")}</div>
            <HandNote tone="red" className="text-lg leading-tight">
              {plural("today.debts.overdue", 5)}
            </HandNote>
          </Sticker>
        </Feature>

        <Feature
          href="/app/reports"
          tab={t("nav.reports")}
          title={t("landing.features.reports.title")}
          text={t("landing.features.reports.text")}
          open={open}
        >
          <div aria-hidden className="flex h-[72px] items-end gap-1.5">
            {weekProfit.map((day) => (
              <span
                key={day.short}
                style={{ height: `${Math.max(8, (Math.max(day.profit, 0) / best) * 100)}%` }}
                className={cn(
                  "flex-1 rounded-t-[4px] border-[1.5px] border-ink",
                  day.profit < 0 ? "bg-red-soft" : day.profit === best ? "bg-marker" : "bg-pen-soft",
                )}
              />
            ))}
          </div>
        </Feature>
      </div>
    </section>
  );
}
