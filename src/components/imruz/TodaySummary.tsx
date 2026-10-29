import { Marker } from "@/components/daftar/Marker";
import { formatSomoni, MINUS } from "@/lib/format";

type TodaySummaryProps = {
  income: number;
  expense: number;
};

export function TodaySummary({ income, expense }: TodaySummaryProps) {
  const profit = income - expense;
  const gain = profit >= 0;
  return (
    <div className="min-w-0">
      <div className="font-display text-xl font-bold text-ink-2 lg:text-[28px]">Имрӯз шумо…</div>
      <div className="mt-1.5 font-display leading-none font-extrabold tracking-[-0.03em]">
        <Marker className="px-1 text-[62px] lg:px-1.5 lg:text-[76px] xl:text-[104px]">{formatSomoni(profit, { sign: true, unit: false })}</Marker>
        <span className="ml-2.5 hidden text-[32px] lg:inline">сомонӣ</span>
      </div>
      <div className="mt-2 font-display text-xl font-bold lg:mt-2.5 lg:text-[34px]">
        <span className="lg:hidden">сомонӣ </span>
        {gain ? "фоида кардед." : "зарар кардед."}
      </div>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-base text-ink lg:mt-4 lg:text-lg">
        <span>
          Даромад <b className="text-green">{formatSomoni(income, { unit: false })}</b>
        </span>
        <span aria-hidden>{MINUS}</span>
        <span>
          Хароҷот <b className="text-red">{formatSomoni(expense, { unit: false })}</b>
        </span>
        <span aria-hidden>=</span>
        <span>
          {gain ? "Фоида" : "Зарар"} <Marker className="px-1 font-bold">{formatSomoni(Math.abs(profit), { unit: false })}</Marker>
        </span>
      </p>
    </div>
  );
}
