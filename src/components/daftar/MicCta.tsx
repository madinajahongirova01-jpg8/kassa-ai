import Link from "next/link";
import { HandNote } from "@/components/daftar/HandNote";
import { MicIcon } from "@/components/daftar/icons";

export function MicCta() {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative flex size-[132px] items-center justify-center">
        <span className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-pen opacity-45" />
        <span className="absolute inset-3.5 rounded-full bg-pen/12" />
        <Link
          href="/app/new"
          aria-label="Гап занед"
          className="relative flex size-[84px] items-center justify-center rounded-full bg-pen text-card shadow-mic active:scale-95"
        >
          <MicIcon size={34} strokeWidth={2} />
        </Link>
      </div>
      <div className="text-center">
        <div className="font-display text-[15px] font-bold">Гап занед</div>
        <HandNote tone="muted" className="text-[21px]">
          ман менависам
        </HandNote>
      </div>
    </div>
  );
}
