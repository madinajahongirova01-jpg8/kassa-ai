import { Card } from "@/components/daftar/Card";
import { HandNote } from "@/components/daftar/HandNote";
import { useLocale, useT } from "@/components/i18n/I18nProvider";
import type { ReportBar } from "@/data/hisobot";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";

type ReportChartProps = {
  title: string;
  note: string;
  bars: ReportBar[];
};

export function ReportChart({ title, note, bars }: ReportChartProps) {
  const t = useT();
  const locale = useLocale();
  const max = Math.max(0, ...bars.map((b) => Math.abs(b.value)));
  return (
    <Card shadow="lg" className="flex min-h-[300px] flex-col gap-2.5 rounded-sheet px-4 pt-[18px] pb-3.5 lg:min-h-0 lg:px-[22px]">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-base font-bold">{title}</h2>
        <HandNote className="text-xl lg:text-[22px]">{note}</HandNote>
      </div>
      {bars.length === 0 ? (
        <div role="status" className="flex flex-1 items-center justify-center">
          <HandNote tone="muted" className="text-center text-2xl">
            {t("report.chart.empty")}
          </HandNote>
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 items-end gap-2 border-b-[1.5px] border-ink px-1.5 sm:gap-5">
            {bars.map((bar) => (
              <div key={bar.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                <span className={cn("font-mono text-[11px] sm:text-xs", bar.current ? "font-bold text-ink" : bar.value < 0 ? "text-red" : "text-ink-2")}>
                  {formatMoney(bar.value, { unit: false, locale })}
                </span>
                <div
                  style={{ height: `${max > 0 ? Math.max((Math.abs(bar.value) / max) * 88, 3) : 3}%` }}
                  className={cn(
                    "w-full rounded-t-[10px] border-[1.5px] border-b-0 border-ink",
                    bar.current ? "bg-marker" : bar.value < 0 ? "bg-red-soft" : "bg-pen-soft",
                  )}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 px-1.5 text-xs text-ink-2 sm:gap-5">
            {bars.map((bar) => (
              <span key={bar.label} className={cn("flex-1 text-center", bar.current && "font-bold text-ink")}>
                {bar.label}
              </span>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
