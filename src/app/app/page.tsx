import { MicCta } from "@/components/daftar/MicCta";
import { DebtStickers, UrgentDebtSticker } from "@/components/imruz/DebtStickers";
import { TodayHeadline, TodayHeadlineMobile } from "@/components/imruz/TodayHeadline";
import { TodayReceipt, TodayReceiptMobile } from "@/components/imruz/TodayReceipt";
import { TodayStats, TodayStatsMobile } from "@/components/imruz/TodayStats";
import { WeekProfitChart } from "@/components/imruz/WeekProfitChart";
import { expenseHint, todayEntries, weekProfit } from "@/data/imruz";
import { changeFromYesterday, daySummary } from "@/lib/imruz";

export default function ImruzPage() {
  const summary = daySummary(todayEntries);
  const change = changeFromYesterday(weekProfit);

  return (
    <>
      <div className="hidden h-[calc(100dvh-116px)] min-h-[744px] grid-cols-[minmax(0,1fr)_350px_268px] gap-[26px] xl:grid">
        <section className="flex min-w-0 flex-col gap-[22px]">
          <TodayHeadline profit={summary.profit} change={change} />
          <TodayStats income={summary.income} expense={summary.expense} salesCount={summary.salesCount} expenseHint={expenseHint} />
          <WeekProfitChart week={weekProfit} />
        </section>
        <section className="flex min-h-0 flex-col">
          <TodayReceipt entries={todayEntries} />
        </section>
        <section className="flex min-h-0 flex-col gap-3.5">
          <DebtStickers />
          <div className="flex-1" />
          <MicCta />
        </section>
      </div>

      <div className="flex flex-col gap-4 xl:hidden">
        <TodayHeadlineMobile profit={summary.profit} change={change} />
        <TodayStatsMobile income={summary.income} expense={summary.expense} />
        <TodayReceiptMobile entries={todayEntries} />
        <UrgentDebtSticker />
      </div>
    </>
  );
}
