import { Icon } from "@/components/ui/Icon";
import { processingSteps, voiceSession } from "@/data/voice";
import { cn } from "@/lib/cn";

const stepStyles = {
  done: { row: "bg-surface-container-low text-on-surface", icon: "check_circle", iconClass: "text-primary", progress: "text-on-surface-variant font-bold" },
  active: { row: "bg-secondary-container/40 font-medium text-primary", icon: "hourglass_top", iconClass: "animate-pulse text-primary", progress: "text-primary font-bold" },
  pending: { row: "bg-surface-container text-on-surface-variant opacity-60", icon: "radio_button_unchecked", iconClass: "", progress: "text-on-surface-variant" },
};

export function ProcessingSteps() {
  return (
    <div className="space-y-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-xs">
      <div className="flex items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tertiary-container/10 text-tertiary-container">
            <Icon name="sync" className="animate-spin text-lg" />
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Ҳолати коркарди AI</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{voiceSession.engine}</p>
          </div>
        </div>
        <button type="button" className="font-body-sm text-body-sm font-semibold text-error hover:underline">
          Бекор кардан
        </button>
      </div>
      <div className="space-y-space-sm pt-space-xs">
        {processingSteps.map((step) => {
          const style = stepStyles[step.status];
          return (
            <div key={step.label} className={cn("flex items-center justify-between rounded-lg p-space-sm", style.row)}>
              <div className="flex items-center gap-space-sm font-body-md text-body-md">
                <Icon name={style.icon} className={cn("text-xl", style.iconClass)} />
                <span>{step.label}</span>
              </div>
              <span className={cn("font-label-caps text-label-caps", style.progress)}>{step.progress}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
