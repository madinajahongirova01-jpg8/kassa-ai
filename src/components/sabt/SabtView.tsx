"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { HandNote } from "@/components/daftar/HandNote";
import { Recorder } from "@/components/sabt/Recorder";
import { NewReceipt } from "@/components/sabt/NewReceipt";
import { SabtSteps } from "@/components/sabt/SabtSteps";
import { SaidCard } from "@/components/sabt/SaidCard";
import { sabtDemo, sabtModes, type SabtMode } from "@/data/sabt";
import { cn } from "@/lib/cn";
import { parseSabt, sabtProfit } from "@/lib/sabt";

function PhotoDrop({ fileName, onFile }: { fileName: string | null; onFile: (name: string) => void }) {
  return (
    <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[20px] border-2 border-dashed border-ink-3 bg-card/60 px-4 text-center text-ink-2 hover:border-pen">
      <input type="file" accept="image/*" className="sr-only" onChange={(event) => event.target.files?.[0] && onFile(event.target.files[0].name)} />
      <span className="font-display text-base font-bold text-ink">{fileName ?? "Акси чекро интихоб кунед"}</span>
      <HandNote className="text-xl">{fileName ? "акс қабул шуд — дар намуна чек аз матн сохта мешавад" : "ё ба ин ҷо кашед"}</HandNote>
    </label>
  );
}

export function SabtView() {
  const [mode, setMode] = useState<SabtMode>("voice");
  const [text, setText] = useState(sabtDemo.transcript);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(sabtDemo.seconds);
  const [confirmed, setConfirmed] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const entries = useMemo(() => parseSabt(text), [text]);
  const profit = sabtProfit(entries);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setSeconds((s) => Math.min(s + 1, 59)), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  function toggleRecording() {
    if (!recording) {
      setSeconds(0);
      setConfirmed(false);
    }
    setRecording(!recording);
  }

  function edit() {
    setConfirmed(false);
    setMode("text");
    window.requestAnimationFrame(() => textRef.current?.focus());
  }

  function changeText(next: string) {
    setText(next);
    setConfirmed(false);
  }

  const steps = [
    { title: mode === "text" ? "Шумо навиштед" : "Шумо гуфтед", note: mode === "text" ? `${text.length} аломат` : `${seconds} сония`, done: !recording },
    { title: "AI фаҳмид", note: `${entries.length} сабт, ${profit >= 0 ? "1 фоида" : "1 зарар"}`, done: entries.length > 0 && !recording },
    { title: confirmed ? "Тасдиқ шуд" : "Шумо тасдиқ кунед", note: confirmed ? "дар дафтари имрӯз" : "чекро бинед →", done: confirmed, active: !confirmed },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-7 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-10">
      <section className="flex min-w-0 flex-col gap-[18px]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {sabtModes.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={mode === item.id}
                onClick={() => setMode(item.id)}
                className={cn(
                  "h-[38px] rounded-full border-[1.5px] border-ink px-4",
                  mode === item.id ? "bg-ink font-semibold text-card" : "bg-card font-medium text-ink hover:text-pen",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Link href="/app" className="hidden h-[38px] items-center rounded-full border-[1.5px] border-ink bg-card px-4 font-semibold text-ink hover:text-pen sm:flex">
            ✕ Пӯшидан
          </Link>
        </div>

        {mode === "photo" ? (
          <PhotoDrop fileName={photo} onFile={setPhoto} />
        ) : (
          <SaidCard mode={mode} text={text} entries={entries} onText={changeText} textRef={textRef} />
        )}
        {mode === "voice" && <Recorder recording={recording} seconds={seconds} onToggle={toggleRecording} />}
        <SabtSteps steps={steps} />
      </section>

      <section className="flex flex-col lg:pt-1">
        <NewReceipt entries={entries} profit={profit} confirmed={confirmed} onEditRow={edit} />
        <div className="mt-[26px] flex gap-3">
          <button
            type="button"
            onClick={edit}
            className="h-[54px] flex-1 rounded-card border-[1.5px] border-ink bg-card text-[15px] font-semibold text-ink hover:text-pen"
          >
            Ислоҳ
          </button>
          {confirmed ? (
            <Link
              href="/app"
              className="flex h-[54px] flex-2 items-center justify-center rounded-card border-[1.5px] border-ink bg-green font-display text-[15px] font-bold text-card shadow-hard hover:text-card"
            >
              Сабт шуд → Имрӯз
            </Link>
          ) : (
            <button
              type="button"
              disabled={entries.length === 0 || recording}
              onClick={() => setConfirmed(true)}
              className="h-[54px] flex-2 rounded-card border-[1.5px] border-ink bg-pen font-display text-[15px] font-bold text-card shadow-hard active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm disabled:bg-pen-pale disabled:shadow-none"
            >
              Тасдиқ ✓
            </button>
          )}
        </div>
        <p className="mt-3 text-center text-xs text-ink-2">Пас аз тасдиқ ба «Дафтари имрӯз» илова мешавад</p>
      </section>
    </div>
  );
}
