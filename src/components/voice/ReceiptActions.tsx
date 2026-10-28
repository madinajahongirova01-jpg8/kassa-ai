"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export function ReceiptActions({ variant }: { variant: "desktop" | "mobile" }) {
  const [saved, setSaved] = useState(false);

  const confirm = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  if (variant === "mobile") {
    return (
      <div className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={confirm}
          className={cn(
            "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-space-md py-3 font-headline-sm text-headline-sm font-extrabold shadow-md transition-all active:scale-95",
            saved ? "bg-primary text-on-primary" : "bg-tertiary-fixed text-on-tertiary-fixed",
          )}
        >
          <Icon name={saved ? "done_all" : "check_circle"} className="text-[22px]" />
          {saved ? "Сабт шуд!" : "Тасдиқ (Ба дафтар сабт кун)"}
        </button>
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-surface-container px-space-md py-2.5 font-body-md text-body-md font-semibold text-on-surface transition-colors active:bg-surface-container-high"
        >
          <Icon name="edit_note" className="text-[18px]" />
          Ислоҳ кардан
        </button>
      </div>
    );
  }

  return (
    <div className="mt-space-md w-full max-w-md space-y-space-sm">
      <button
        type="button"
        onClick={confirm}
        className="flex w-full items-center justify-center gap-space-xs rounded-xl bg-primary px-space-lg py-3.5 font-headline-sm text-headline-sm font-bold text-on-primary shadow-md transition-all hover:bg-primary-container"
      >
        <Icon name={saved ? "done_all" : "check_circle"} className="text-xl" />
        {saved ? "Сабт шуд!" : "Тасдиқ ва ворид кардан"}
      </button>
      <div className="grid grid-cols-2 gap-space-sm">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-space-xs rounded-lg bg-surface-container-lowest px-space-md py-2.5 font-body-md text-body-md font-semibold text-on-surface shadow-xs transition-colors hover:bg-surface-container"
        >
          <Icon name="edit" className="text-lg" />
          Ислоҳ кардан
        </button>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-space-xs rounded-lg bg-surface-container-lowest px-space-md py-2.5 font-body-md text-body-md font-semibold text-error shadow-xs transition-colors hover:bg-error-container hover:text-on-error-container"
        >
          <Icon name="delete" className="text-lg" />
          Рад кардан
        </button>
      </div>
    </div>
  );
}
