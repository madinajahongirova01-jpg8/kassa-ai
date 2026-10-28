import { Card } from "@/components/daftar/Card";
import { HandNote } from "@/components/daftar/HandNote";
import { Marker } from "@/components/daftar/Marker";
import { monthSummary } from "@/data/daftar";
import { cn } from "@/lib/cn";
import { formatSomoni } from "@/lib/format";

const buttonClass = "h-[42px] flex-1 rounded-xl border-[1.5px] border-ink bg-card font-semibold text-ink hover:text-pen";

export function MonthPanel({ onExcel }: { onExcel: () => void }) {
  const { label, income, expense, breakdown, note } = monthSummary;
  const largest = Math.max(...breakdown.map((b) => b.amount));
  return (
    <section className="flex flex-col gap-4 lg:min-h-0">
      <Card className="rounded-sheet px-5 py-[18px]">
        <h2 className="font-display text-[15px] font-bold">Моҳи {label}</h2>
        <div className="mt-3.5 flex justify-between">
          <span className="text-ink-2">Пул даромад</span>
          <span className="font-mono font-bold text-green">{formatSomoni(income, { sign: true, unit: false })}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-ink-2">Пул рафт</span>
          <span className="font-mono font-bold text-red">{formatSomoni(-expense, { unit: false })}</span>
        </div>
        <div className="my-3 border-t-[1.5px] border-dashed border-line-strong" />
        <div className="flex items-baseline justify-between">
          <span className="font-bold">Фоида</span>
          <Marker className="px-1 font-display text-2xl font-extrabold">{formatSomoni(income - expense, { unit: false })}</Marker>
        </div>
      </Card>

      <Card shadow="none" className="flex flex-col gap-3 rounded-sheet px-5 py-[18px] lg:min-h-0 lg:flex-1">
        <h2 className="font-display text-[15px] font-bold">Пул ба куҷо рафт?</h2>
        {breakdown.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-[13px]">
              <span>{item.label}</span>
              <b className="font-mono">{formatSomoni(item.amount, { unit: false })}</b>
            </div>
            <div
              style={{ width: `${Math.max((item.amount / largest) * 100, 5)}%` }}
              className={cn("mt-1.5 h-3 rounded-md", item.alert ? "bg-red-soft" : "bg-marker")}
            />
          </div>
        ))}
        <HandNote tone="red" className="mt-0.5 -rotate-2 text-[22px] leading-tight">
          {note}
        </HandNote>
        <div className="flex-1" />
        <div className="flex gap-2.5 print:hidden">
          <button type="button" onClick={onExcel} className={buttonClass}>
            Excel
          </button>
          <button type="button" onClick={() => window.print()} className={buttonClass}>
            PDF
          </button>
        </div>
      </Card>
    </section>
  );
}
