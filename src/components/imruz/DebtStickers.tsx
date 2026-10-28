"use client";

import Link from "next/link";
import { HandNote } from "@/components/daftar/HandNote";
import { Sticker, type StickerTape } from "@/components/daftar/Sticker";
import type { DebtCustomer } from "@/data/debts";
import { cn } from "@/lib/cn";
import { buildDebtRows, daysUntil, type DebtRow } from "@/lib/debts";
import { useDebtState } from "@/lib/debtStore";
import { formatDayMonth, formatSomoni } from "@/lib/format";

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
  const days = row.customer.dueDate ? daysUntil(row.customer.dueDate) : null;
  if (row.status === "overdue" && days !== null) return { tape: "red", tone: "red", note: `${Math.abs(days)} рӯз гузашт — занг занед!` };
  if (days === 0) return { tape: "yellow", tone: "pen", note: "мӯҳлат — имрӯз" };
  if (days === 1) return { tape: "yellow", tone: "pen", note: "мӯҳлат — фардо" };
  if (row.customer.dueDate) return { tape: "blue", tone: "muted", note: `то ${formatDayMonth(row.customer.dueDate)}` };
  return { tape: "blue", tone: "muted", note: "бе мӯҳлат" };
}

function useDebtorRows() {
  const { customers, events } = useDebtState();
  return buildDebtRows(customers, events).filter((row) => row.balance > 0);
}

export function DebtStickers({ limit = 3 }: { limit?: number }) {
  const rows = useDebtorRows().slice(0, limit);
  return (
    <>
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-bold">Насия</h2>
        <Link href="/app/debts" className="border-b-[1.5px] border-ink text-[13px] font-semibold text-ink hover:text-pen">
          ҳама
        </Link>
      </div>
      {rows.map((row, index) => {
        const look = stickerLook(row);
        const turn = rotations[index % rotations.length];
        return (
          <Sticker key={row.customer.id} tape={look.tape} rotate={turn.rotate} tapeRotate={turn.tape}>
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-bold">{shortName(row.customer)}</span>
              <span className={cn("font-display text-xl font-bold", row.status === "overdue" && "text-red")}>
                {formatSomoni(row.balance, { unit: false })}
              </span>
            </div>
            <HandNote tone={look.tone} className="mt-0.5 block text-[22px] leading-tight">
              {look.note}
            </HandNote>
          </Sticker>
        );
      })}
    </>
  );
}

export function UrgentDebtSticker() {
  const rows = useDebtorRows();
  const row = rows.find((r) => r.status === "overdue") ?? rows.find((r) => r.status === "near");
  if (!row) return null;
  const look = stickerLook(row);
  return (
    <Link href="/app/debts" className="block text-ink hover:text-ink">
      <Sticker tape={look.tape} rotate={-1} tapeRotate={-4} size="sm">
        <div className="flex items-baseline justify-between">
          <span className="font-bold">{shortName(row.customer)} · насия</span>
          <span className={cn("font-display text-[17px] font-bold", row.status === "overdue" && "text-red")}>
            {formatSomoni(row.balance, { unit: false })}
          </span>
        </div>
        <HandNote tone={look.tone} className="block text-xl leading-tight">
          {look.note}
        </HandNote>
      </Sticker>
    </Link>
  );
}
