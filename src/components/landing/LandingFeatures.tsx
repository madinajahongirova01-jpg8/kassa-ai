import Link from "next/link";
import type { ReactNode } from "react";
import { HandNote } from "@/components/daftar/HandNote";
import { Marker } from "@/components/daftar/Marker";
import { Sticker } from "@/components/daftar/Sticker";
import { todayEntries, weekProfit } from "@/data/imruz";
import { cn } from "@/lib/cn";
import { formatSomoni } from "@/lib/format";
import { daySummary, signedAmount } from "@/lib/imruz";

type FeatureProps = {
  href: string;
  tab: string;
  title: string;
  text: string;
  children: ReactNode;
};

function Feature({ href, tab, title, text, children }: FeatureProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-sheet border-[1.5px] border-ink bg-card p-5 text-ink shadow-hard transition-transform hover:-translate-y-0.5 hover:text-ink lg:p-6"
    >
      <span className="self-start rounded-full bg-ink px-3 py-1 text-xs font-semibold text-card">{tab}</span>
      <h3 className="mt-3 font-display text-xl font-bold">{title}</h3>
      <p className="mt-1 text-sm text-ink-2">{text}</p>
      <div className="mt-5 flex flex-1 flex-col justify-end">{children}</div>
      <span className="mt-4 text-sm font-semibold group-hover:text-pen">Кушодан →</span>
    </Link>
  );
}

export function LandingFeatures() {
  const summary = daySummary(todayEntries);
  const best = Math.max(...weekProfit.map((day) => day.profit));

  return (
    <section id="imkoniyatho" className="scroll-mt-6">
      <h2 className="font-display text-[28px] leading-tight font-extrabold tracking-[-0.02em] lg:text-[36px]">Ҳамаи пули дӯкон дар як дафтар</h2>
      <p className="mt-2 max-w-[620px] text-ink-2">
        Бе калимаҳои душвор: «Пул даромад», «Пул рафт», «Ба шумо қарздоранд».
      </p>
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Feature href="/app" tab="Имрӯз" title="Фоидаи рӯз дар як ҷумла" text="Чӣ қадар пул омад, чӣ қадар рафт ва чӣ монд.">
          <div>
            <HandNote className="text-xl">Имрӯз шумо…</HandNote>
            <div className="font-display text-[34px] leading-none font-extrabold tracking-[-0.03em]">
              <Marker className="px-1">{formatSomoni(summary.profit, { sign: true, unit: false })}</Marker>
            </div>
            <div className="mt-1.5 font-display text-sm font-bold">сомонӣ фоида кардед.</div>
          </div>
        </Feature>

        <Feature href="/app/transactions" tab="Дафтар" title="Ҳамаи сабтҳо рӯз ба рӯз" text="Ҳар фурӯш ва хароҷот бо вақт ва сумма.">
          <div className="font-mono text-[12.5px]">
            {todayEntries.slice(0, 3).map((entry, index) => (
              <div key={entry.id} className={cn("flex gap-2 py-1.5", index < 2 && "border-b border-dotted border-line")}>
                <span className="text-ink-3">{entry.time}</span>
                <span className="min-w-0 flex-1 truncate">{entry.shortTitle}</span>
                <span className={cn("font-bold", signedAmount(entry) >= 0 ? "text-green" : "text-red")}>
                  {formatSomoni(signedAmount(entry), { sign: true, unit: false })}
                </span>
              </div>
            ))}
          </div>
        </Feature>

        <Feature href="/app/debts" tab="Насия" title="Ба шумо қарздоранд" text="Кӣ чӣ қадар қарз дорад ва мӯҳлаташ кай аст.">
          <Sticker tape="red" rotate={-1.5} tapeRotate={-3} size="sm" alert className="mt-2">
            <div className="text-sm font-bold">Насияи гузашта</div>
            <HandNote tone="red" className="text-lg leading-tight">
              5 рӯз гузашт — занг занед!
            </HandNote>
          </Sticker>
        </Feature>

        <Feature href="/app/reports" tab="Ҳисобот" title="Ҳафта ва моҳ дар як нигоҳ" text="Кадом рӯз беҳтарин буд ва пул ба куҷо рафт.">
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
