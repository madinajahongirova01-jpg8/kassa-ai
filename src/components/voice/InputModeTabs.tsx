"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const modes = [
  { id: "voice", label: "Овозӣ", icon: "mic" },
  { id: "text", label: "Матнӣ", icon: "edit_note" },
  { id: "scan", label: "Скан чеки коғазӣ", icon: "document_scanner" },
];

const languages = ["ТОҶ", "РУС"];

export function InputModeTabs() {
  const [mode, setMode] = useState("voice");
  const [language, setLanguage] = useState("ТОҶ");

  return (
    <div className="flex items-center justify-between gap-space-sm rounded-xl bg-surface-container-high p-1.5">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={cn(
              "flex shrink-0 items-center gap-space-xs rounded-lg px-space-md py-1.5 font-body-sm text-body-sm transition-colors",
              mode === item.id
                ? "bg-surface-container-lowest font-semibold text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            <Icon name={item.icon} className="text-base" />
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-space-xs rounded-lg bg-surface-container-lowest px-space-sm py-1">
        {languages.map((item, index) => (
          <span key={item} className="flex items-center gap-space-xs">
            {index > 0 && <span className="font-label-caps text-label-caps text-outline-variant">/</span>}
            <button
              type="button"
              onClick={() => setLanguage(item)}
              className={cn(
                "font-label-caps text-label-caps",
                language === item ? "font-semibold text-primary" : "text-on-surface-variant",
              )}
            >
              {item}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
