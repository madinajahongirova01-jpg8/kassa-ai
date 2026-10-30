import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/daftar/Card";
import { HandNote } from "@/components/daftar/HandNote";
import { SimpleHeader } from "@/components/daftar/SimpleHeader";

type StatusPageProps = {
  note: string;
  title: string;
  text: string;
  homeText: string;
  /** An extra action before the home link, e.g. "Try again" on the error page. */
  action?: ReactNode;
};

export const statusActionClass =
  "flex h-[54px] flex-1 items-center justify-center rounded-card border-[1.5px] border-ink bg-card text-[15px] font-semibold text-ink hover:text-pen";

/** The 404 and error screens: same frame as the login page, so they look like the rest of the site. */
export function StatusPage({ note, title, text, homeText, action }: StatusPageProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SimpleHeader />
      <main className="mx-auto flex w-full max-w-[600px] min-w-0 flex-1 flex-col gap-5 px-[18px] pt-8 pb-10 lg:pt-12">
        <div>
          <HandNote tone="red" className="inline-block -rotate-2 text-[26px] lg:text-[30px]">
            {note}
          </HandNote>
          <h1 className="mt-0.5 font-display text-[30px] font-extrabold lg:text-4xl">{title}</h1>
        </div>
        <Card className="flex flex-col gap-4 rounded-sheet p-[22px]">
          <p className="text-[15px] text-ink-2">{text}</p>
          <div className="flex gap-3">
            {action}
            <Link
              href="/"
              className="flex h-[54px] flex-2 items-center justify-center rounded-card border-[1.5px] border-ink bg-pen px-3 text-center font-display text-[15px] font-bold text-card shadow-hard hover:text-card"
            >
              {homeText}
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
