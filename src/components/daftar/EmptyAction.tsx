import Link from "next/link";
import { cn } from "@/lib/cn";

const actionClass =
  "inline-flex h-11 items-center justify-center rounded-full border-[1.5px] border-ink bg-pen px-5 font-display text-sm font-bold text-card shadow-hard-sm hover:text-card active:translate-x-px active:translate-y-px active:shadow-none";

type EmptyActionProps = { text: string; action: string; className?: string } & ({ href: string; onAction?: never } | { href?: never; onAction: () => void });

export function EmptyAction({ text, action, href, onAction, className }: EmptyActionProps) {
  return (
    <div role="status" className={cn("flex flex-col items-center gap-3 py-8 text-center", className)}>
      <p className="max-w-[34ch] text-[15px] text-ink-2">{text}</p>
      {href ? (
        <Link href={href} className={actionClass}>
          {action}
        </Link>
      ) : (
        <button type="button" onClick={onAction} className={actionClass}>
          {action}
        </button>
      )}
    </div>
  );
}
