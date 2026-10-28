import Link from "next/link";
import { Card } from "@/components/daftar/Card";
import { HandNote } from "@/components/daftar/HandNote";
import { MicCta } from "@/components/daftar/MicCta";

export function LandingCta() {
  return (
    <Card shadow="lg" className="flex flex-col items-center gap-6 rounded-[22px] px-5 py-8 text-center md:flex-row md:justify-between md:px-10 md:text-left">
      <div className="min-w-0">
        <h2 className="font-display text-[26px] leading-tight font-extrabold tracking-[-0.02em] lg:text-[34px]">Аввалин сабтро имрӯз кунед</h2>
        <HandNote className="mt-1 inline-block -rotate-1 text-[22px]">як ҷумла гӯед — чек тайёр</HandNote>
        <div className="mt-5">
          <Link
            href="/app"
            className="inline-flex rounded-tile border-[1.5px] border-ink bg-ink px-6 py-3 font-display text-base font-bold text-card shadow-hard hover:bg-pen hover:border-pen"
          >
            Дафтарро кушоед
          </Link>
        </div>
      </div>
      <MicCta />
    </Card>
  );
}
