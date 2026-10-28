import { CloudSyncBanner, CloudSyncPill } from "@/components/overview/CloudSync";
import { DueDebtsAlert, DueDebtsCard } from "@/components/overview/DueDebtsCard";
import { ExpenseBreakdownCard } from "@/components/overview/ExpenseBreakdownCard";
import { FlowChartCard, FlowChartCompact } from "@/components/overview/FlowChartCard";
import { OverviewKpis } from "@/components/overview/OverviewKpis";
import { QuickInputCard, QuickInputCompact } from "@/components/overview/QuickInputCard";
import { RecentTransactionsCard, RecentTransactionsList } from "@/components/overview/RecentTransactions";
import { SmartReceipt } from "@/components/receipt/SmartReceipt";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { todayReceipt } from "@/data/overview";

export default function OverviewPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-space-md px-margin pt-space-sm pb-space-md lg:space-y-space-lg lg:p-space-lg">
      <div className="flex justify-end">
        <DemoBadge />
      </div>

      <div className="space-y-space-md lg:hidden">
        <QuickInputCompact />
        <SmartReceipt receipt={todayReceipt} />
        <OverviewKpis compact />
        <FlowChartCompact />
        <DueDebtsAlert />
        <RecentTransactionsList />
        <CloudSyncPill />
      </div>

      <div className="hidden space-y-space-lg lg:block">
        <section className="grid grid-cols-12 items-start gap-space-lg">
          <div className="col-span-7">
            <QuickInputCard />
          </div>
          <SmartReceipt receipt={todayReceipt} className="col-span-5" />
        </section>

        <OverviewKpis />

        <section className="grid grid-cols-12 items-start gap-space-lg">
          <div className="col-span-12 space-y-space-lg xl:col-span-7">
            <FlowChartCard />
            <RecentTransactionsCard />
          </div>
          <div className="col-span-12 space-y-space-lg xl:col-span-5">
            <ExpenseBreakdownCard />
            <DueDebtsCard />
            <CloudSyncBanner />
          </div>
        </section>
      </div>
    </div>
  );
}
