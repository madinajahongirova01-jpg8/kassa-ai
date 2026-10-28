import Link from "next/link";
import { Card } from "@/components/daftar/Card";
import { HandNote } from "@/components/daftar/HandNote";
import { CurvedArrow, MicIcon } from "@/components/daftar/icons";
import { Marker } from "@/components/daftar/Marker";
import { Receipt, ReceiptDivider } from "@/components/daftar/Receipt";
import { Stamp } from "@/components/daftar/Stamp";
import { Highlighted } from "@/components/sabt/SaidCard";
import { sabtDemo } from "@/data/sabt";
import { cn } from "@/lib/cn";
import { formatSomoni } from "@/lib/format";
import { parseSabt } from "@/lib/sabt";

export function LandingHero() {
  const entries = parseSabt(sabtDemo.transcript);
  const profit = entries.reduce((sum, entry) => sum + (entry.kind === "income" ? entry.amount : -entry.amount), 0);

  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:items-center lg:gap-14">
      <div className="min-w-0">
        <HandNote className="inline-block -rotate-2 text-[26px] lg:text-[32px]">Шумо гап мезанед…</HandNote>
        <h1 className="mt-2 font-display text-[40px] leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-[56px] xl:text-[68px]">
          Kassa AI <Marker className="px-1.5">менависад.</Marker>
        </h1>
        <p className="mt-5 max-w-135 text-base leading-relaxed text-ink-2 lg:text-lg">
          Дафтари рақамӣ барои дӯкон ва тиҷорати хурд. Пули даромад, пули рафт ва насияро бо овоз, матн ё акси чек сабт кунед —
          AI суммаҳоро ҷудо карда, чек месозад.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/app/new"
            className="flex items-center justify-center gap-2.5 rounded-tile border-[1.5px] border-ink bg-pen px-6 py-3.5 font-display text-base font-bold text-card shadow-hard hover:bg-[#2340c0] active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm"
          >
            <MicIcon size={20} strokeWidth={2.2} />
            Гап занед
          </Link>
          <Link
            href="/app"
            className="flex items-center justify-center rounded-tile border-[1.5px] border-ink bg-card px-6 py-3.5 font-display text-base font-bold text-ink shadow-hard hover:text-pen active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm"
          >
            Намунаро бинед
          </Link>
        </div>
        <p className="mt-3.5 text-xs text-ink-3">Дар саҳифаҳо ҳоло маълумоти намунавӣ нишон дода мешавад.</p>
      </div>

      <div className="relative min-w-0">
        <Card shadow="lg" className="relative rounded-3xl px-5 pt-6 pb-5 lg:px-6">
          <span className="absolute -top-3.5 right-4 rotate-3 rounded-lg border-[1.5px] border-ink bg-marker px-2.5 py-0.5 font-hand text-xl font-semibold">
            {entries.length} сабт ёфтам!
          </span>
          <div className="text-xs font-semibold tracking-wider text-ink-3 uppercase">Шумо гуфтед</div>
          <p className="mt-2 font-display text-lg leading-[1.7] font-medium lg:text-xl">
            «<Highlighted text={sabtDemo.transcript} entries={entries} />»
          </p>
          <div className="mt-2 flex flex-wrap gap-x-5 font-hand text-xl font-semibold">
            <span className="text-red">● сурх — пул рафт</span>
            <span className="text-green">● сабз — пул омад</span>
          </div>
        </Card>

        <div className="mt-2 flex items-start gap-3 pl-6 text-pen">
          <CurvedArrow className="mt-1 hidden -scale-x-100 rotate-80 sm:block" />
          <Receipt className="w-full max-w-85 px-5 pt-6 pb-7 text-[13px] sm:ml-auto">
            <div className="text-center font-display text-[15px] font-bold tracking-[0.06em]">ЧЕКИ НАВ</div>
            <div className="mt-1 text-center text-[11px] text-ink-2">
              №{sabtDemo.receiptNumber} · {sabtDemo.date} · {sabtDemo.time}
            </div>
            <ReceiptDivider className="mt-3 mb-1" />
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className={cn("flex items-center justify-between gap-3 py-2", index < entries.length - 1 && "border-b border-dotted border-line")}
              >
                <span className="truncate">{entry.title}</span>
                <span className={cn("font-bold", entry.kind === "income" ? "text-green" : "text-red")}>
                  {formatSomoni(entry.kind === "income" ? entry.amount : -entry.amount, { sign: true, unit: false })}
                </span>
              </div>
            ))}
            <ReceiptDivider className="mt-1.5 mb-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>ФОИДА</span>
              <span className={profit >= 0 ? "text-green" : "text-red"}>{formatSomoni(profit, { sign: true, unit: false })}</span>
            </div>
            <div className="mt-4 flex justify-end pr-1">
              <Stamp size="sm">ТАСДИҚ ШУД ✓</Stamp>
            </div>
          </Receipt>
        </div>
      </div>
    </section>
  );
}
