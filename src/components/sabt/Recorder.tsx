import { Card } from "@/components/daftar/Card";
import { HandNote } from "@/components/daftar/HandNote";
import { MicIcon } from "@/components/daftar/icons";
import { waveform } from "@/data/sabt";
import { cn } from "@/lib/cn";

type RecorderProps = {
  recording: boolean;
  seconds: number;
  onToggle: () => void;
};

export function Recorder({ recording, seconds, onToggle }: RecorderProps) {
  const played = Math.round(waveform.length * 0.72);
  return (
    <Card shadow="none" className="flex items-center gap-4 rounded-[20px] px-4 py-4 lg:gap-[22px] lg:px-[22px]">
      <div className="relative flex size-[76px] flex-none items-center justify-center lg:size-[92px]">
        <span className={cn("absolute inset-0 rounded-full border-[1.5px] border-dashed border-pen opacity-50", recording && "animate-spin [animation-duration:6s]")} />
        <span className="absolute inset-2.5 rounded-full bg-pen/15" />
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={recording}
          aria-label={recording ? "Бас кардан" : "Боз гап занед"}
          className={cn(
            "relative flex size-[52px] items-center justify-center rounded-full text-card shadow-mic active:scale-95 lg:size-[60px]",
            recording ? "bg-red" : "bg-pen",
          )}
        >
          {recording ? <span className="size-5 rounded-[4px] bg-card" /> : <MicIcon size={26} strokeWidth={2} />}
        </button>
      </div>
      <div className="flex h-[50px] min-w-0 flex-1 items-center gap-1 overflow-hidden">
        {waveform.map((height, index) => (
          <span
            key={index}
            style={{ height: `${height}%`, animationDelay: `${index * 70}ms` }}
            className={cn(
              "w-[5px] flex-none rounded-[3px]",
              recording || index < played ? "bg-pen" : "bg-pen-pale",
              recording && "animate-pulse",
              index > 14 && "hidden sm:block",
            )}
          />
        ))}
        <span className="ml-3.5 font-mono text-[13px] text-ink-2">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>
      </div>
      <div className="hidden text-right sm:block">
        <div className="font-display text-sm font-bold">{recording ? "Гӯш мекунам…" : "Боз гап занед"}</div>
        <HandNote tone="muted" className="text-xl">
          {recording ? "тамом шуд — пахш кунед" : "агар чизе монда бошад"}
        </HandNote>
      </div>
    </Card>
  );
}
