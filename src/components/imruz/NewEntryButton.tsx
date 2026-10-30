import Link from "next/link";
import { MicIcon } from "@/components/daftar/icons";

export function NewEntryButton() {
  return (
    <Link
      href="/app/new"
      className="flex w-full shrink-0 items-center gap-4 rounded-card border-[1.5px] border-ink bg-pen px-5 py-4 text-card shadow-hard hover:text-card active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm lg:w-auto lg:px-7 lg:py-5"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-card text-pen lg:size-14">
        <MicIcon size={26} strokeWidth={2} />
      </span>
      <span>
        <span className="block font-display text-2xl font-bold lg:text-[28px]">+ Сабти нав</span>
        <span className="block text-sm text-pen-soft lg:text-base">
          Нависед <span className="ml-1 text-xs opacity-80">· Овоз — ба наздикӣ</span>
        </span>
      </span>
    </Link>
  );
}
