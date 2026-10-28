import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

const tones = {
  pen: "text-pen",
  red: "text-red",
  muted: "text-ink-2",
};

type HandNoteProps = ComponentPropsWithoutRef<"span"> & {
  tone?: keyof typeof tones;
};

export function HandNote({ tone = "pen", className, ...props }: HandNoteProps) {
  return <span className={cn("font-hand font-semibold", tones[tone], className)} {...props} />;
}
