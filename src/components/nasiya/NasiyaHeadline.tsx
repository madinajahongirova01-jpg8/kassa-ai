import Link from "next/link";
import { HandNote } from "@/components/daftar/HandNote";
import { Marker } from "@/components/daftar/Marker";
import { formatMoney } from "@/lib/format";

type NasiyaHeadlineProps = {
  total: number;
  overdueCount: number;
};

export function NasiyaHeadline({ total, overdueCount }: NasiyaHeadlineProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <HandNote className="inline-block -rotate-2 text-[26px] lg:text-[30px]">Ба шумо…</HandNote>
        <div className="mt-1 font-display leading-none font-extrabold tracking-[-0.03em]">
          <Marker className="px-1.5 text-[56px] lg:text-[76px]">{formatMoney(total, { unit: false })}</Marker>
          <span className="ml-2 text-xl lg:ml-2.5 lg:text-[28px]">сомонӣ</span>
        </div>
        <div className="mt-2 font-display text-xl font-bold lg:text-[26px]">қарздоранд.</div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-3">
        {overdueCount > 0 && (
          <HandNote tone="red" className="rotate-3 text-[22px] leading-none lg:text-[26px]">
            {overdueCount} нафар дер кард!
          </HandNote>
        )}
        <Link
          href="/app/new"
          className="flex h-10 items-center rounded-tile border-[1.5px] border-ink bg-marker px-3.5 font-display text-xs font-bold text-ink shadow-hard hover:text-ink active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm lg:h-[46px] lg:px-5 lg:text-sm"
        >
          + Қарзи нав
        </Link>
      </div>
    </div>
  );
}
