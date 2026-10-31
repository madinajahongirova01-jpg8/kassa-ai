import { Suspense } from "react";
import { PageLoading } from "@/components/daftar/PageState";
import { DebtStickers } from "@/components/imruz/DebtStickers";
import { NewEntryButton } from "@/components/imruz/NewEntryButton";
import { StartCard } from "@/components/imruz/StartCard";
import { TodayEntries } from "@/components/imruz/TodayEntries";
import { TodaySummary } from "@/components/imruz/TodaySummary";
import { hasAnyCashEntry, loadTodayCashEntries } from "@/lib/api/cash-book";
import { loadDebtBook } from "@/lib/api/debt-book";
import { getT } from "@/lib/i18n/server";
import { cashDaySummary } from "@/lib/todayCash";

export default async function ImruzPage() {
  const t = await getT();
  return (
    <Suspense fallback={<PageLoading text={t("today.loading")} />}>
      <Imruz />
    </Suspense>
  );
}

async function Imruz() {
  const [entries, book, hasEntry] = await Promise.all([
    loadTodayCashEntries("/app"),
    loadDebtBook("/app", { withPayments: false }),
    hasAnyCashEntry("/app"),
  ]);
  const summary = cashDaySummary(entries);

  return (
    <div className="flex flex-col gap-6 lg:gap-9">
      <StartCard progress={{ hasEntry, hasCustomer: book.customers.length > 0 }} />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <TodaySummary income={summary.income} expense={summary.expense} />
        <NewEntryButton />
      </div>
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-9">
        <TodayEntries entries={entries} />
        <DebtStickers customers={book.customers} today={book.today} />
      </div>
    </div>
  );
}
