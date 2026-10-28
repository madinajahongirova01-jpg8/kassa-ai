import { HandNote } from "@/components/daftar/HandNote";
import type { WeekDay } from "@/data/imruz";
import { cn } from "@/lib/cn";
import { formatSomoni } from "@/lib/format";
import { bestDay } from "@/lib/imruz";

function barClass(day: WeekDay, best: boolean) {
  if (day.today) return "border-dashed bg-[repeating-linear-gradient(45deg,var(--color-green-mid)_0_6px,var(--color-green-soft)_6px_12px)]";
  if (best) return "bg-marker";
  if (day.profit < 0) return "bg-red-soft";
  return "bg-pen-soft";
}

function labelClass(day: WeekDay, best: boolean) {
  if (day.today) return "font-bold text-green";
  if (best) return "font-bold text-ink";
  if (day.profit < 0) return "text-red";
  return "text-ink-2";
}

export function WeekProfitChart({ week }: { week: WeekDay[] }) {
  const best = bestDay(week);
  const max = Math.max(...week.map((d) => Math.abs(d.profit)));
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 rounded-sheet border-[1.5px] border-ink bg-card px-5 pt-4 pb-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-base font-bold">Фоидаи ҳафта</h2>
        <HandNote className="text-[22px]">{best.name} беҳтарин рӯз буд</HandNote>
      </div>
      <div className="flex min-h-[180px] flex-1 items-end gap-3.5 border-b-[1.5px] border-ink px-1">
        {week.map((day) => {
          const isBest = day === best;
          return (
            <div key={day.short} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className={cn("font-mono text-[11px]", labelClass(day, isBest))}>{formatSomoni(day.profit, { unit: false })}</span>
              <div
                style={{ height: `${Math.max((Math.abs(day.profit) / max) * 88, 4)}%` }}
                className={cn("w-full rounded-t-lg border-[1.5px] border-b-0 border-ink", barClass(day, isBest))}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-3.5 px-1 text-xs text-ink-2">
        {week.map((day) => (
          <span
            key={day.short}
            className={cn("flex-1 text-center", day.today ? "font-bold text-green" : day === best && "font-bold text-ink")}
          >
            {day.short}
          </span>
        ))}
      </div>
    </div>
  );
}
