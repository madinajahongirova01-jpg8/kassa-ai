import { Icon } from "@/components/ui/Icon";
import { Waveform } from "@/components/voice/Waveform";
import { voiceReceiptItems, voiceSession } from "@/data/voice";

export function VoiceCaptureCard() {
  return (
    <div className="relative space-y-space-lg overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-xs">
      <div className="flex items-start justify-between gap-space-sm">
        <div className="space-y-space-xs">
          <span className="font-label-caps text-label-caps font-bold tracking-wider text-primary uppercase">
            Гӯшкунӣ ва транскрипсия
          </span>
          <p className="font-headline-sm text-headline-sm font-bold text-on-surface">Овози тоҷикии фурӯшанда</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-space-sm py-1 font-label-caps text-label-caps font-semibold text-primary">
          <Icon name="verified" className="text-sm" />
          Эътимоднокӣ: {voiceSession.confidence}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-space-md rounded-xl bg-surface-container-low p-space-md">
        <Waveform className="h-16 w-full max-w-md px-4" />
        <div className="flex items-center gap-space-md">
          <button
            type="button"
            aria-label="Сабти овоз"
            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-all hover:bg-primary-container"
          >
            <span className="absolute -inset-1 animate-ping rounded-full bg-tertiary/20" />
            <Icon name="mic" className="text-3xl" />
          </button>
          <button
            type="button"
            title="Гӯш кардани садои сабтшуда"
            className="rounded-full bg-surface-container-high p-2.5 text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <Icon name="volume_up" className="text-xl" />
          </button>
        </div>
      </div>

      <div className="space-y-space-xs">
        <span className="font-label-caps text-label-caps font-medium text-on-surface-variant uppercase">
          Матни сабтшуда (Тоҷикӣ)
        </span>
        <div className="relative rounded-xl bg-surface-container-low p-space-md font-body-lg text-body-lg leading-relaxed text-on-surface">
          <span className="font-bold text-tertiary">«</span>
          {voiceSession.transcript}
          <span className="font-bold text-tertiary">»</span>
          <div className="mt-space-sm flex items-center gap-space-xs font-body-sm text-body-sm font-semibold text-primary">
            <Icon name="auto_awesome" className="text-base" />
            AI {voiceReceiptItems.length} амалиёти молиявиро муайян намуд
          </div>
        </div>
      </div>
    </div>
  );
}

export function VoiceCaptureCompact() {
  return (
    <div className="relative flex flex-col gap-space-sm overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed shadow-xs">
            <Icon name="mic" filled className="text-[20px]" />
          </div>
          <span className="font-label-caps text-label-caps font-semibold text-on-surface-variant uppercase">
            Овози сабтшуда ({voiceSession.duration})
          </span>
        </div>
        <Waveform size="sm" className="rounded-full bg-surface-container-highest px-2.5 py-1" />
      </div>
      <div className="rounded-lg bg-surface-container-lowest p-space-sm shadow-xs">
        <p className="line-clamp-2 font-body-md text-body-md leading-relaxed text-on-surface italic">
          «{voiceSession.transcript}»
        </p>
      </div>
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center justify-between gap-space-sm text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <Icon name="sync" className="animate-spin text-[18px] text-primary" />
            <span className="font-body-sm text-body-sm font-medium">Ҳолати коркард: AI таҳлил мекунад…</span>
          </div>
          <span className="shrink-0 font-label-caps text-label-caps font-bold text-primary">100% Тамом</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <div className="h-full w-full rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
