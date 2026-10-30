"use client";

import { useState } from "react";
import { HandNote } from "@/components/daftar/HandNote";
import { Marker } from "@/components/daftar/Marker";
import { ReportChart } from "@/components/hisobot/ReportChart";
import { ReportInsights } from "@/components/hisobot/ReportInsights";
import { reportPeriods, type ReportPeriod } from "@/data/hisobot";
import { cn } from "@/lib/cn";
import { formatDayMonth, formatMoney } from "@/lib/format";
import { buildPeriodReport, reportCsv, reportFileName, type ReportData } from "@/lib/hisobot";

const exportClass = "h-[38px] rounded-xl border-[1.5px] border-ink bg-card px-3.5 font-semibold text-ink hover:text-pen disabled:text-ink-3";

function downloadCsv(csv: string, fileName: string) {
  const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportView({ data }: { data: ReportData }) {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const report = buildPeriodReport(data, period);
  const loss = report.profit < 0;
  const empty = report.days.length === 0;

  return (
    <div className="flex flex-col gap-5 lg:h-[calc(100dvh-116px)] lg:min-h-[680px]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <HandNote className="inline-block -rotate-2 text-[26px] lg:text-[30px]">{report.lead}</HandNote>
          <div className="mt-1 font-display leading-none font-extrabold tracking-[-0.03em]">
            <Marker className={cn("px-1.5 text-[56px] lg:text-[64px] xl:text-[76px]", loss && "text-red")}>
              {formatMoney(Math.abs(report.profit), { unit: false })}
            </Marker>
            <span className="mt-2 block text-xl font-bold lg:ml-2.5 lg:inline lg:text-[24px] xl:text-[28px]">
              {loss ? "сомонӣ зарар кардед." : "сомонӣ фоида кардед."}
            </span>
          </div>
          <p className="mt-2 hidden text-sm text-ink-2 print:block">
            Ҳисоботи Kassa AI · {formatDayMonth(report.from)} {report.from.slice(0, 4)} — {formatDayMonth(report.to)} {report.to.slice(0, 4)}
          </p>
          <p className="mt-2 text-sm text-ink-2">
            {report.hasCash
              ? `Даромад ${formatMoney(report.income, { unit: false })} − хароҷот ${formatMoney(report.expense, { unit: false })}. Насия ба фоида дохил намешавад.`
              : "Дар ин давра ҳоло даромад ё хароҷот сабт нашудааст."}
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          {report.note && (
            <HandNote tone="green" className="rotate-2 text-[22px] leading-none lg:text-[26px]">
              {report.note}
            </HandNote>
          )}
          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <div className="flex gap-1.5 rounded-full border-[1.5px] border-ink bg-card p-1">
              {reportPeriods.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={period === item.id}
                  onClick={() => setPeriod(item.id)}
                  className={cn("h-8 rounded-full px-3.5", period === item.id ? "bg-ink font-semibold text-card" : "text-ink hover:text-pen")}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button type="button" disabled={empty} onClick={() => downloadCsv(reportCsv(report), reportFileName(report))} className={exportClass}>
              Excel (.csv)
            </button>
            <button type="button" disabled={empty} onClick={() => window.print()} className={cn(exportClass, "hidden sm:block")}>
              PDF (чоп)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <ReportChart title={report.chartTitle} note={report.chartNote} bars={report.bars} />
        <ReportInsights best={report.best} worst={report.worst} debtGiven={report.debtGiven} debtReturned={report.debtReturned} />
      </div>
    </div>
  );
}
