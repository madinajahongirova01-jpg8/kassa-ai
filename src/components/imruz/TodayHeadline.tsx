import { HandNote } from "@/components/daftar/HandNote";
import { CurvedArrow } from "@/components/daftar/icons";
import { Marker } from "@/components/daftar/Marker";
import { formatSomoni } from "@/lib/format";

function changeNote(change: number | null) {
  if (change === null) return null;
  return change >= 0 ? `${change}% беҳтар!` : `${Math.abs(change)}% камтар`;
}

type TodayHeadlineProps = {
  profit: number;
  change: number | null;
};

export function TodayHeadline({ profit, change }: TodayHeadlineProps) {
  const note = changeNote(change);
  return (
    <div className="relative pt-1.5">
      <HandNote className="inline-block -rotate-2 text-[32px]">Имрӯз шумо…</HandNote>
      <div className="mt-1.5 font-display leading-none font-extrabold tracking-[-0.03em]">
        <Marker className="px-1.5 text-[76px] xl:text-[104px]">{formatSomoni(profit, { sign: true, unit: false })}</Marker>
        <span className="ml-2.5 text-[32px]">сомонӣ</span>
      </div>
      <div className="mt-2.5 font-display text-[34px] font-bold">{profit >= 0 ? "фоида кардед." : "зарар кардед."}</div>
      {note && (
        <div className="absolute right-0 bottom-[-4px] flex rotate-6 flex-col items-center text-red xl:top-[30px] xl:right-2 xl:bottom-auto">
          <HandNote tone="red" className="text-[24px] leading-none xl:text-[30px]">
            аз дирӯз
            <br />
            {note}
          </HandNote>
          <span className="hidden xl:block">
            <CurvedArrow />
          </span>
        </div>
      )}
    </div>
  );
}

export function TodayHeadlineMobile({ profit, change }: TodayHeadlineProps) {
  const note = changeNote(change);
  return (
    <div>
      <HandNote className="inline-block -rotate-2 text-[26px]">Имрӯз шумо…</HandNote>
      <div className="mt-1 font-display leading-none font-extrabold tracking-[-0.03em]">
        <Marker className="px-1 text-[62px]">{formatSomoni(profit, { sign: true, unit: false })}</Marker>
      </div>
      <div className="mt-2 font-display text-xl font-bold">сомонӣ {profit >= 0 ? "фоида кардед." : "зарар кардед."}</div>
      {note && (
        <HandNote tone="red" className="mt-0.5 block text-[22px]">
          аз дирӯз {note}
        </HandNote>
      )}
    </div>
  );
}
