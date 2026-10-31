"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, usePlural, useT } from "@/components/i18n/I18nProvider";
import { Recorder } from "@/components/sabt/Recorder";
import { NewReceipt } from "@/components/sabt/NewReceipt";
import { SabtSteps } from "@/components/sabt/SabtSteps";
import { SaidCard } from "@/components/sabt/SaidCard";
import { sabtDemo, sabtModes, type SabtMode } from "@/data/sabt";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { canSaveSabt, cashSabtEntries, MAX_SABT_AMOUNT, sabtProfit, toCashEntriesPayload } from "@/lib/sabt";
import { parseOnServer, rulesResult, shouldAskServer, type ParsedText } from "@/lib/sabtParse";
import { saveErrorKey } from "@/lib/sabtText";
import { speechErrorKey, useSpeechRecognition } from "@/lib/useSpeechRecognition";

const PARSE_DELAY_MS = 700;
const SABT_EXAMPLES = ["sale", "flour", "wage"] as const;

export function SabtView() {
  const t = useT();
  const plural = usePlural();
  const locale = useLocale();
  const [mode, setMode] = useState<SabtMode>("text");
  const [text, setText] = useState(sabtDemo.transcript);
  const [seconds, setSeconds] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<{ status: number; message: string } | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const speech = useSpeechRecognition("tg-TJ", changeText);
  const recording = speech.listening;

  const [parsed, setParsed] = useState<{ text: string; result: ParsedText } | null>(null);
  const local = useMemo(() => rulesResult(text), [text]);
  const current = parsed?.text === text ? parsed.result : local;
  const entries = current.entries;
  const profit = sabtProfit(entries);
  const cashCount = cashSabtEntries(entries).length;
  const isDemo = text === sabtDemo.transcript;
  const parsedText = parsed?.text;

  useEffect(() => {
    if (isDemo || recording || confirmed || parsedText === text || !shouldAskServer(text)) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void parseOnServer(text).then((result) => {
        if (!cancelled) setParsed({ text, result });
      });
    }, PARSE_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [text, parsedText, isDemo, recording, confirmed]);

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
      setSaveError({ status: 400, message: t("sabt.errors.amount", { max: formatNumber(MAX_SABT_AMOUNT, 0, locale) }) });
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
        setSaveError({ status: response.status, message: t(saveErrorKey(response.status)) });
        return;
      }
      setConfirmed(true);
    } catch {
      setSaveError({ status: 0, message: t(saveErrorKey(0)) });
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    {
      title: mode === "text" ? t("sabt.steps.wrote") : t("sabt.steps.said"),
      note: mode === "text" ? plural("sabt.steps.characters", text.length) : plural("sabt.steps.seconds", seconds),
      done: !recording,
    },
    {
      title: t("sabt.steps.counted"),
      note: `${plural("sabt.steps.entries", cashCount)}, ${profit >= 0 ? t("sabt.steps.oneProfit") : t("sabt.steps.oneLoss")}`,
      done: cashCount > 0 && !recording,
    },
    {
      title: confirmed ? t("sabt.steps.confirmed") : t("sabt.steps.confirm"),
      note: confirmed ? t("sabt.steps.saved") : t("sabt.steps.seeReceipt"),
      done: confirmed,
      active: !confirmed,
    },
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
                {t(item.labelKey)}
                {item.tagKey && <span className={cn("text-[11px] font-semibold", mode === item.id ? "text-card/70" : "text-ink-3")}>{t(item.tagKey)}</span>}
              </button>
            ))}
          </div>
          <Link href="/app" className="hidden h-[38px] items-center rounded-full border-[1.5px] border-ink bg-card px-4 font-semibold text-ink hover:text-pen sm:flex">
            ✕ {t("sabt.close")}
          </Link>
        </div>

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
        {mode === "text" && !confirmed && !saving && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink-2">{t("sabt.examples.hint")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{t("sabt.examples.label")}</span>
              {SABT_EXAMPLES.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => changeText(t(`sabt.examples.${key}`))}
                  className="h-9 rounded-full border-[1.5px] border-ink bg-card px-3.5 text-sm font-medium text-ink hover:text-pen"
                >
                  {t(`sabt.examples.${key}`)}
                </button>
              ))}
            </div>
          </div>
        )}
        {mode === "voice" &&
          (speech.supported ? (
            <Recorder recording={recording} seconds={seconds} onToggle={toggleRecording} />
          ) : (
            <p role="status" className="rounded-[20px] border-[1.5px] border-dashed border-ink-3 bg-card px-4 py-4 text-sm text-ink-2">
              {t("sabt.voice.unsupported")}{" "}
              <button type="button" onClick={edit} className="font-semibold text-pen underline">
                {t("sabt.voice.toText")}
              </button>
            </p>
          ))}
        {mode === "voice" && speech.error && (
          <p role="alert" className="text-sm font-medium text-red">
            {t(speechErrorKey(speech.error))}{" "}
            <button type="button" onClick={edit} className="font-semibold text-pen underline">
              {t("sabt.voice.typeManually")}
            </button>
          </p>
        )}
        <SabtSteps steps={steps} />
      </section>

      <section className="flex flex-col lg:pt-1">
        {text.trim() && (
          <p role="status" className="mb-3 text-center text-xs font-semibold text-ink-2">
            {current.source === "ai" ? t("sabt.parsedBy.ai") : t("sabt.parsedBy.rules")}
          </p>
        )}
        <NewReceipt entries={entries} profit={profit} confirmed={confirmed} onEditRow={edit} />
        <div className="mt-[26px] flex gap-3">
          <button
            type="button"
            onClick={edit}
            disabled={confirmed || saving}
            className="h-[54px] flex-1 rounded-card border-[1.5px] border-ink bg-card text-[15px] font-semibold text-ink hover:text-pen disabled:text-ink-3"
          >
            {t("sabt.actions.edit")}
          </button>
          {confirmed ? (
            <button
              type="button"
              onClick={startNew}
              className="flex h-[54px] flex-2 items-center justify-center rounded-card border-[1.5px] border-ink bg-green font-display text-[15px] font-bold text-card shadow-hard hover:text-card"
            >
              {t("sabt.actions.savedNew")}
            </button>
          ) : (
            <button
              type="button"
              disabled={cashCount === 0 || recording || saving || isDemo}
              onClick={save}
              className="h-[54px] flex-2 rounded-card border-[1.5px] border-ink bg-pen font-display text-[15px] font-bold text-card shadow-hard active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm disabled:bg-pen-pale disabled:shadow-none"
            >
              {saving ? t("sabt.actions.saving") : t("sabt.actions.confirm")}
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
                  {t("sabt.errors.signIn")}
                </Link>
              </>
            )}
          </p>
        )}
        <p role="status" className="mt-3 text-center text-xs text-ink-2">
          {confirmed
            ? t("sabt.status.saved")
            : isDemo
              ? t("sabt.status.demo")
              : t("sabt.status.afterConfirm")}
        </p>
      </section>
    </div>
  );
}
