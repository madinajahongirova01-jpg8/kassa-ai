"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

type DebtDialogProps = {
  title: string;
  icon: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  onSubmit?: () => void;
};

export function DebtDialog({ title, icon, onClose, children, footer, onSubmit }: DebtDialogProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-space-md">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="debt-dialog-title"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.();
        }}
        className="relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-surface-container-lowest shadow-modal sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex items-center justify-between bg-surface-container-low px-space-md py-space-sm">
          <div className="flex items-center gap-space-xs">
            <Icon name={icon} className="text-primary" />
            <h2 id="debt-dialog-title" className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Пӯшидан"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </div>
        <div className="flex flex-col gap-space-md overflow-y-auto p-space-md no-scrollbar">{children}</div>
        {footer && <div className="flex items-center gap-space-sm bg-surface-container-low p-space-md">{footer}</div>}
      </form>
    </div>
  );
}

export const dialogLabel = "mb-1.5 block font-label-caps text-label-caps text-on-surface-variant uppercase";
export const dialogInput =
  "w-full rounded-lg bg-surface-container-low px-3 py-2.5 font-body-md text-body-md text-on-surface focus:bg-surface-container-lowest focus:ring-[1.5px] focus:ring-primary-container focus:outline-none";
export const dialogCancel =
  "flex-1 rounded-lg bg-surface-container-high py-2.5 font-body-sm text-body-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-highest";
export const dialogSubmit =
  "flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2.5 font-body-sm text-body-sm font-bold text-on-primary shadow-md transition-all hover:bg-primary-container disabled:opacity-50";
