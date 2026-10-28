import Link from "next/link";
import { DetailedReceipt } from "@/components/receipt/DetailedReceipt";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { Icon } from "@/components/ui/Icon";
import { InputModeTabs } from "@/components/voice/InputModeTabs";
import { ProcessingSteps } from "@/components/voice/ProcessingSteps";
import { ReceiptActions } from "@/components/voice/ReceiptActions";
import { RecentVoiceRecords } from "@/components/voice/RecentVoiceRecords";
import { TreasuryImpact } from "@/components/voice/TreasuryImpact";
import { VoiceCaptureCard, VoiceCaptureCompact } from "@/components/voice/VoiceCaptureCard";
import { voiceReceiptItems, voiceSession } from "@/data/voice";

export default function NewRecordPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-space-md px-margin pt-space-sm pb-6 lg:gap-space-lg lg:px-space-lg lg:py-space-md">
      <div className="flex items-center justify-between pt-1 lg:hidden">
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2.5 py-1.5 text-on-surface transition-transform active:scale-95 active:bg-surface-container-high"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          <span className="font-body-md text-body-md font-semibold">Шарҳ</span>
        </Link>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-2.5 py-1 text-on-secondary-container">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span className="font-label-caps text-label-caps font-bold tracking-wider uppercase">{voiceSession.modelShort}</span>
        </div>
      </div>
      <div className="flex flex-col lg:hidden">
        <span className="font-label-caps text-label-caps font-bold tracking-wider text-primary uppercase">
          Сабти овозӣ ва таҳлил
        </span>
        <h1 className="font-headline-md text-headline-md font-extrabold tracking-tight text-on-surface">Натиҷаи чеки AI</h1>
        <DemoBadge className="mt-space-xs self-start" />
      </div>

      <div className="hidden items-center justify-between gap-space-sm rounded-xl bg-surface-container-lowest p-space-md shadow-xs lg:flex">
        <div className="space-y-space-xs">
          <div className="flex items-center gap-space-xs font-label-caps text-label-caps tracking-wider text-on-surface-variant uppercase">
            <span>Kassa AI</span>
            <Icon name="chevron_right" className="text-xs" />
            <span className="font-bold text-primary">Сабти овозӣ</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-extrabold tracking-tight text-on-surface">
            Сабти фаврии овозӣ ва чеки ҳушманд
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-space-sm">
          <DemoBadge />
          <div className="flex items-center gap-space-xs rounded-full bg-secondary-container px-space-sm py-1.5 font-label-caps text-label-caps font-semibold text-on-secondary-container">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            {voiceSession.model}
          </div>
          <div className="flex items-center gap-space-xs rounded-lg bg-surface-container px-space-sm py-1.5 font-body-sm text-body-sm text-on-surface-variant">
            <Icon name="schedule" className="text-sm" />
            {voiceSession.time}
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <VoiceCaptureCompact />
      </div>

      <div className="grid grid-cols-1 items-start gap-space-md lg:grid-cols-12 lg:gap-space-lg">
        <div className="hidden space-y-space-lg lg:col-span-6 lg:block xl:col-span-7">
          <InputModeTabs />
          <VoiceCaptureCard />
          <ProcessingSteps />
          <TreasuryImpact />
        </div>
        <div className="flex flex-col items-center pt-1 lg:col-span-6 lg:pt-0 xl:col-span-5">
          <DetailedReceipt items={voiceReceiptItems} actions={<ReceiptActions variant="mobile" />} />
          <div className="hidden w-full justify-center lg:flex">
            <ReceiptActions variant="desktop" />
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <RecentVoiceRecords />
      </div>
    </div>
  );
}
