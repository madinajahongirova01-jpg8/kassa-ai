import { Suspense } from "react";
import { PageLoading } from "@/components/daftar/PageState";
import { DebtStickers } from "@/components/imruz/DebtStickers";
import { NewEntryButton } from "@/components/imruz/NewEntryButton";
import { TodayEntries } from "@/components/imruz/TodayEntries";
import { TodaySummary } from "@/components/imruz/TodaySummary";
import { loadTodayCashEntries } from "@/lib/api/cash-book";
import { cashDaySummary } from "@/lib/todayCash";

export default function ImruzPage() {
  return (
    <Suspense fallback={<PageLoading text="дафтари имрӯз кушода мешавад…" />}>
      <Imruz />
    </Suspense>
  );
}

async function Imruz() {
  const entries = await loadTodayCashEntries("/app");
  const summary = cashDaySummary(entries);

  return (
    <div className="flex flex-col gap-6 lg:gap-9">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <TodaySummary income={summary.income} expense={summary.expense} />
        <NewEntryButton />
      </div>
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-9">
        <TodayEntries entries={entries} />
        <DebtStickers />
      </div>
    </div>
  );
}
