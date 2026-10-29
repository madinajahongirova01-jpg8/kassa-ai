"use client";

import Link from "next/link";
import { HandNote } from "@/components/daftar/HandNote";
import { Sticker, type StickerTape } from "@/components/daftar/Sticker";
import type { DebtCustomer } from "@/data/debts";
import { cn } from "@/lib/cn";
import { buildDebtRows, type DebtRow } from "@/lib/debts";
import { useDebtState } from "@/lib/debtStore";
import { formatDayMonth, formatSomoni } from "@/lib/format";
import { useDebtOverview } from "@/lib/useDebtOverview";

const rotations = [
  { rotate: -1.5, tape: 3 },
  { rotate: 1.2, tape: -4 },
  { rotate: -0.8, tape: 2 },
];

function shortName(customer: DebtCustomer) {
  const [first, last] = customer.name.split(" ");
  return last ? `${first} ${last[0]}.` : first;
}

function stickerLook(row: DebtRow): { tape: StickerTape; tone: "pen" | "red" | "muted"; note: string } {
  const days = row.daysLeft;
  if (row.status === "overdue" && days !== null) return { tape: "red", tone: "red", note: `${Math.abs(days)} рӯз гузашт — занг занед!` };
  if (days === 0) return { tape: "yellow", tone: "pen", note: "мӯҳлат — имрӯз" };
  if (days === 1) return { tape: "yellow", tone: "pen", note: "мӯҳлат — фардо" };
  if (row.customer.dueDate) return { tape: "blue", tone: "muted", note: `то ${formatDayMonth(row.customer.dueDate)}` };
  return { tape: "blue", tone: "muted", note: "бе мӯҳлат" };
}

function useDebtorRows() {
  const { today, customers, events } = useDebtState();
  return buildDebtRows(customers, events, today).filter((row) => row.balance > 0);
}

const plainTones = {
  pen: "text-pen",
  red: "text-red",
  muted: "text-ink-2",
};

export function DebtStickers({ limit = 3 }: { limit?: number }) {
  const { totals } = useDebtOverview();
  const rows = useDebtorRows().slice(0, limit);
  const handNoteId = rows.find((row) => row.status === "overdue")?.customer.id;
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-bold lg:text-xl">Ба шумо қарздоранд</h2>
        <div className="mt-1.5 font-display text-[34px] leading-none font-extrabold text-pen">{formatSomoni(totals.total)}</div>
        <div className="mt-1 text-sm text-ink-2">{totals.debtorCount} нафар</div>
      </div>
      {rows.length === 0 ? (
        <p className="text-ink-2">Ҳоло қарздор нест.</p>
      ) : (
        rows.map((row, index) => {
          const look = stickerLook(row);
          const turn = rotations[index % rotations.length];
          return (
            <Sticker key={row.customer.id} tape={look.tape} rotate={turn.rotate} tapeRotate={turn.tape}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[15px] font-bold">{shortName(row.customer)}</span>
                <span className={cn("shrink-0 font-display text-xl font-bold", row.status === "overdue" && "text-red")}>
                  {formatSomoni(row.balance, { unit: false })}
                </span>
              </div>
              {row.customer.id === handNoteId ? (
                <HandNote tone={look.tone} className="mt-0.5 block text-[22px] leading-tight">
                  {look.note}
                </HandNote>
              ) : (
                <span className={cn("mt-1 block text-sm font-medium", plainTones[look.tone])}>{look.note}</span>
              )}
            </Sticker>
          );
        })
      )}
      <Link
        href="/app/debts"
        className="mt-1 flex items-center justify-center rounded-full border-[1.5px] border-ink bg-card px-5 py-3 font-display text-base font-bold text-ink shadow-hard-sm hover:text-pen"
      >
        Ҳамаи қарзҳо →
      </Link>
    </section>
  );
}
