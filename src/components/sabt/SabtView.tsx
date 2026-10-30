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
import { canSaveSabt, cashSabtEntries, MAX_SABT_AMOUNT, parseSabt, sabtProfit, toCashEntriesPayload } from "@/lib/sabt";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";

function PhotoDrop({ fileName, onFile }: { fileName: string | null; onFile: (name: string) => void }) {
  return (
    <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[20px] border-2 border-dashed border-ink-3 bg-card/60 px-4 text-center text-ink-2 hover:border-pen">
      <input type="file" accept="image/*" className="sr-only" onChange={(event) => event.target.files?.[0] && onFile(event.target.files[0].name)} />
      <span className="font-display text-base font-bold text-ink">{fileName ?? "Акси чекро интихоб кунед"}</span>
      <HandNote className="text-xl">{fileName ? "акс қабул шуд — дар намуна чек аз матн сохта мешавад" : "ё ба ин ҷо кашед"}</HandNote>
    </label>
  );
}

function saveErrorText(status: number) {
  if (status === 400) return "Маълумотро санҷед: ҳар сабт бояд ном ва маблағ дошта бошад.";
  if (status === 401) return "Сессия тамом шуд. Дубора дароед ва боз сабт кунед.";
  if (status === 403) return "Дархост рад шуд. Саҳифаро нав кунед ва боз кӯшиш кунед.";
  if (status === 429) return "Кӯшишҳо зиёд шуданд. Каме сабр карда, боз кӯшиш кунед.";
  return "Сервер ҳоло ҷавоб намедиҳад. Сабт нигоҳ дошта нашуд, боз кӯшиш кунед.";
}

export function SabtView() {
  const [mode, setMode] = useState<SabtMode>("text");
  const [text, setText] = useState(sabtDemo.transcript);
  const [seconds, setSeconds] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<{ status: number; message: string } | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const speech = useSpeechRecognition("tg-TJ", changeText);
  const recording = speech.listening;

  const entries = useMemo(() => parseSabt(text), [text]);
  const profit = sabtProfit(entries);
  const cashCount = cashSabtEntries(entries).length;
  const isDemo = text === sabtDemo.transcript;

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  function toggleRecording() {
    if (recording) {
      speech.stop();
      return;
    }
    setSeconds(0);
    setConfirmed(false);
    speech.start();
  }

  function edit() {
    setConfirmed(false);
    setMode("text");
    window.requestAnimationFrame(() => textRef.current?.focus());
  }

  function changeText(next: string) {
    setText(next);
    setConfirmed(false);
    setSaveError(null);
  }

  function startNew() {
    changeText("");
    setMode("text");
    window.requestAnimationFrame(() => textRef.current?.focus());
  }

  async function save() {
    if (saving) return;
    if (!canSaveSabt(entries)) {
      setSaveError({ status: 400, message: `Маблағ бояд аз 1 то ${MAX_SABT_AMOUNT.toLocaleString("ru-RU")} сомонӣ бошад.` });
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch("/api/cash-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toCashEntriesPayload(entries, mode === "voice" ? "VOICE" : "TEXT")),
      });
      if (!response.ok) {
        setSaveError({ status: response.status, message: saveErrorText(response.status) });
        return;
      }
      setConfirmed(true);
    } catch {
      setSaveError({ status: 0, message: saveErrorText(0) });
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    { title: mode === "text" ? "Шумо навиштед" : "Шумо гуфтед", note: mode === "text" ? `${text.length} аломат` : `${seconds} сония`, done: !recording },
    { title: "Ҳисоб шуд", note: `${cashCount} сабт, ${profit >= 0 ? "1 фоида" : "1 зарар"}`, done: cashCount > 0 && !recording },
    { title: confirmed ? "Тасдиқ шуд" : "Шумо тасдиқ кунед", note: confirmed ? "дар база нигоҳ дошта шуд" : "чекро бинед →", done: confirmed, active: !confirmed },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-7 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-10">
      <section className="flex min-w-0 flex-col gap-[18px]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {sabtModes.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={mode === item.id}
                disabled={item.disabled}
                onClick={() => setMode(item.id)}
                className={cn(
                  "flex h-[38px] items-center gap-1.5 rounded-full border-[1.5px] border-ink px-4 disabled:border-dashed disabled:border-ink-3 disabled:text-ink-3 disabled:hover:text-ink-3",
                  mode === item.id ? "bg-ink font-semibold text-card" : "bg-card font-medium text-ink hover:text-pen",
                )}
              >
                {item.label}
                {item.tag && <span className={cn("text-[11px] font-semibold", mode === item.id ? "text-card/70" : "text-ink-3")}>{item.tag}</span>}
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
          <SaidCard
            mode={mode}
            text={text}
            entries={entries}
            demo={isDemo}
            listening={recording}
            locked={confirmed || saving}
            onText={changeText}
            textRef={textRef}
          />
        )}
        {mode === "voice" &&
          (speech.supported ? (
            <Recorder recording={recording} seconds={seconds} onToggle={toggleRecording} />
          ) : (
            <p role="status" className="rounded-[20px] border-[1.5px] border-dashed border-ink-3 bg-card px-4 py-4 text-sm text-ink-2">
              Ин браузер шинохтани овозро дастгирӣ намекунад. Матнро дастӣ нависед.{" "}
              <button type="button" onClick={edit} className="font-semibold text-pen underline">
                Ба матн гузаштан
              </button>
            </p>
          ))}
        {mode === "voice" && speech.error && (
          <p role="alert" className="text-sm font-medium text-red">
            {speech.error}{" "}
            <button type="button" onClick={edit} className="font-semibold text-pen underline">
              Дастӣ навиштан
            </button>
          </p>
        )}
        <SabtSteps steps={steps} />
      </section>

      <section className="flex flex-col lg:pt-1">
        <NewReceipt entries={entries} profit={profit} confirmed={confirmed} onEditRow={edit} />
        <div className="mt-[26px] flex gap-3">
          <button
            type="button"
            onClick={edit}
            disabled={confirmed || saving}
            className="h-[54px] flex-1 rounded-card border-[1.5px] border-ink bg-card text-[15px] font-semibold text-ink hover:text-pen disabled:text-ink-3"
          >
            Ислоҳ
          </button>
          {confirmed ? (
            <button
              type="button"
              onClick={startNew}
              className="flex h-[54px] flex-2 items-center justify-center rounded-card border-[1.5px] border-ink bg-green font-display text-[15px] font-bold text-card shadow-hard hover:text-card"
            >
              Сабт шуд ✓ · Сабти нав +
            </button>
          ) : (
            <button
              type="button"
              disabled={cashCount === 0 || recording || saving || isDemo}
              onClick={save}
              className="h-[54px] flex-2 rounded-card border-[1.5px] border-ink bg-pen font-display text-[15px] font-bold text-card shadow-hard active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm disabled:bg-pen-pale disabled:shadow-none"
            >
              {saving ? "Сабт мешавад…" : "Тасдиқ ✓"}
            </button>
          )}
        </div>
        {saveError && (
          <p role="alert" className="mt-3 text-center text-sm font-semibold text-red">
            {saveError.message}
            {saveError.status === 401 && (
              <>
                {" "}
                <Link href="/login?next=%2Fapp%2Fnew" className="text-pen underline">
                  Даромадан
                </Link>
              </>
            )}
          </p>
        )}
        <p role="status" className="mt-3 text-center text-xs text-ink-2">
          {confirmed
            ? "Сабт дар базаи маълумоти ҳисоби шумо нигоҳ дошта шуд."
            : isDemo
              ? "Ин матни намунавӣ аст — барои сабт маълумоти худро нависед."
              : "Пас аз тасдиқ дар базаи маълумоти ҳисоби шумо нигоҳ дошта мешавад."}
        </p>
      </section>
    </div>
  );
}
