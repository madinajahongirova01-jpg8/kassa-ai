import type { Ref } from "react";
import { Card } from "@/components/daftar/Card";
import { HandNote } from "@/components/daftar/HandNote";
import { DemoBadge } from "@/components/ui/DemoBadge";
import type { SabtMode } from "@/data/sabt";
import { cn } from "@/lib/cn";
import type { SabtEntry } from "@/lib/sabt";

export function Highlighted({ text, entries }: { text: string; entries: SabtEntry[] }) {
  const parts = [];
  let cursor = 0;
  for (const entry of entries) {
    parts.push(text.slice(cursor, entry.start));
    parts.push(
      <span
        key={entry.id}
        className={cn(
          "px-1 font-bold [background:linear-gradient(transparent_55%,var(--mark)_55%,var(--mark)_95%,transparent_95%)]",
          entry.kind === "income" ? "[--mark:var(--color-green-mid)]" : "[--mark:var(--color-red-soft)]",
        )}
      >
        {text.slice(entry.start, entry.end)}
      </span>,
    );
    cursor = entry.end;
  }
  parts.push(text.slice(cursor));
  return <>{parts}</>;
}

type SaidCardProps = {
  mode: SabtMode;
  text: string;
  entries: SabtEntry[];
  demo: boolean;
  listening: boolean;
  onText: (text: string) => void;
  textRef: Ref<HTMLTextAreaElement>;
};

export function SaidCard({ mode, text, entries, demo, listening, onText, textRef }: SaidCardProps) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <HandNote className="inline-block -rotate-2 text-[26px] lg:text-[30px]">
          {mode === "text" ? "Нависед…" : "Шумо гуфтед…"}
        </HandNote>
        {demo && <DemoBadge />}
      </div>
      <Card shadow="lg" className="relative mt-2.5 rounded-[20px] px-5 pt-6 pb-6 lg:px-7 lg:pt-[26px] lg:pb-[30px]">
        {mode === "text" ? (
          <>
            <label htmlFor="sabt-text" className="sr-only">
              Матни сабт
            </label>
            <textarea
              id="sabt-text"
              ref={textRef}
              value={text}
              onChange={(event) => onText(event.target.value)}
              rows={3}
              className="block w-full resize-none bg-transparent font-display text-lg leading-[1.6] font-medium text-ink outline-none lg:text-[22px]"
            />
          </>
        ) : !text ? (
          <HandNote tone="muted" className="text-2xl">
            {listening ? "Гӯш мекунам…" : "Микрофонро пахш карда, гап занед"}
          </HandNote>
        ) : (
          <p className="font-display text-[19px] leading-[1.7] font-medium lg:text-[22px] lg:leading-[1.75] xl:text-[27px]">
            «<Highlighted text={text} entries={entries} />»
          </p>
        )}
        {entries.length > 0 && (
          <span className="absolute -top-[18px] right-4 rotate-5 rounded-lg border-[1.5px] border-ink bg-marker px-2.5 py-0.5 font-hand text-xl font-semibold lg:right-[26px] lg:text-[22px]">
            {entries.length} сабт ёфтам!
          </span>
        )}
      </Card>
      <div className="mt-4 flex flex-wrap gap-x-[26px] gap-y-1 font-hand text-xl font-semibold lg:text-[22px]">
        <span className="text-red">● сурх — пул рафт</span>
        <span className="text-green">● сабз — пул омад</span>
      </div>
    </div>
  );
}
