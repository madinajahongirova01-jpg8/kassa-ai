import { HandNote } from "@/components/daftar/HandNote";
import { Stamp } from "@/components/daftar/Stamp";
import { Sticker, type StickerTape } from "@/components/daftar/Sticker";
import { useLocale, usePlural, useT } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { dayMonth, lastPayment, type DebtRow } from "@/lib/debts";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import type { Plural, Translate } from "@/lib/i18n/translate";

const turns = [
  { rotate: -1.2, tape: 3 },
  { rotate: 1, tape: -4 },
  { rotate: -0.6, tape: 2 },
  { rotate: 0.9, tape: -2 },
  { rotate: -1, tape: 4 },
];

const tapeCycle: StickerTape[] = ["yellow", "blue", "blue", "green", "yellow"];

type NoteText = { t: Translate; plural: Plural; locale: Locale };

function stickerNote(row: DebtRow, today: string, { t, plural, locale }: NoteText): { tone: "pen" | "red" | "green" | "muted"; text: string } {
  if (row.status === "paid") {
    const payment = lastPayment(row);
    return { tone: "green", text: payment ? t("nasiya.sticker.paidBack", { date: dayMonth(payment.date, today, locale) }) : t("nasiya.sticker.noDebt") };
  }
  const days = row.daysLeft;
  if (days === null || !row.customer.dueDate) return { tone: "muted", text: t("nasiya.sticker.noDue") };
  if (days < 0) return { tone: "red", text: plural("nasiya.sticker.overdue", Math.abs(days)) };
  if (days === 0) return { tone: "pen", text: t("nasiya.sticker.dueToday") };
  if (days === 1) return { tone: "pen", text: t("nasiya.sticker.dueTomorrow") };
  return { tone: "muted", text: t("nasiya.sticker.dueBy", { date: dayMonth(row.customer.dueDate, today, locale) }) };
}

type DebtStickerProps = {
  row: DebtRow;
  today: string;
  index: number;
  selected: boolean;
  onSelect: () => void;
};

function DebtSticker({ row, today, index, selected, onSelect }: DebtStickerProps) {
  const { customer, balance, status } = row;
  const overdue = status === "overdue";
  const paid = status === "paid";
  const settled = paid && row.history.some((event) => event.type === "debt");
  const turn = turns[index % turns.length];
  const t = useT();
  const plural = usePlural();
  const locale = useLocale();
  const note = stickerNote(row, today, { t, plural, locale });
  return (
    <Sticker
      tape={overdue ? "red" : tapeCycle[index % tapeCycle.length]}
      rotate={turn.rotate}
      tapeRotate={turn.tape}
      alert={overdue}
      className={cn(
        "flex h-full min-h-[136px] flex-col justify-between gap-3 lg:min-h-0",
        overdue && "-translate-y-1.5",
        paid && "opacity-90",
        selected && !overdue && "shadow-hard",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={t("nasiya.sticker.label", { name: customer.name, amount: formatMoney(balance, { unit: false, locale }) })}
        className="absolute inset-0 z-10 cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pen"
      />
      <div>
        <div className="text-[15px] font-bold">{customer.name}</div>
        <div className="text-xs text-ink-2">{customer.phone}</div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("font-display text-[32px] leading-none font-extrabold", overdue && "text-red", settled && "text-ink-3 line-through")}>
          {formatMoney(settled ? row.originalAmount : balance, { unit: false, locale })}
        </span>
        {settled && (
          <Stamp tone="green" size="sm">
            {t("nasiya.sticker.stamp")}
          </Stamp>
        )}
      </div>
      <HandNote tone={note.tone} className="text-[22px] leading-tight">
        {note.text}
      </HandNote>
    </Sticker>
  );
}

type NasiyaStickersProps = {
  rows: DebtRow[];
  empty: boolean;
  today: string;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
};

export function NasiyaStickers({ rows, empty, today, selectedId, onSelect }: NasiyaStickersProps) {
  const t = useT();
  return (
    <div className="grid grid-cols-1 gap-x-[18px] gap-y-[22px] pt-2.5 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:grid-rows-[repeat(3,minmax(0,1fr))] xl:grid-cols-3 xl:grid-rows-[repeat(2,minmax(0,1fr))]">
      {rows.map((row, index) => (
        <DebtSticker
          key={row.customer.id}
          row={row}
          today={today}
          index={index}
          selected={row.customer.id === selectedId}
          onSelect={() => onSelect(row.customer.id)}
        />
      ))}
      {rows.length === 0 && (
        <HandNote tone="muted" className="self-center text-center text-2xl">
          {empty ? t("nasiya.sticker.empty") : t("nasiya.sticker.noMatches")}
        </HandNote>
      )}
    </div>
  );
}
