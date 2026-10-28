import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/daftar/Card";
import { HandNote } from "@/components/daftar/HandNote";
import { MicIcon } from "@/components/daftar/icons";
import { Marker } from "@/components/daftar/Marker";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { PlanCard } from "@/components/pricing/PlanCard";
import { PricingHeader } from "@/components/pricing/PricingHeader";
import { appFeatures, plans } from "@/data/pricing";

export const metadata: Metadata = {
  title: "Нархнома — Kassa AI",
  description: "Тарофаҳои Kassa AI: Оғоз, Тиҷорат, Pro ва Шабака.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1280px] flex-col gap-12 overflow-x-clip px-4 pt-[18px] pb-10 lg:gap-20 lg:px-8 lg:pt-[22px]">
      <PricingHeader />
      <main className="flex flex-col gap-14 lg:gap-20">
        <section>
          <HandNote className="inline-block -rotate-2 text-[26px] lg:text-[32px]">Нархнома</HandNote>
          <h1 className="mt-2 max-w-[820px] font-display text-[36px] leading-[1.1] font-extrabold tracking-[-0.03em] sm:text-[48px] xl:text-[60px]">
            Тарофаи <Marker className="px-1.5">худро</Marker> интихоб кунед.
          </h1>
          <p className="mt-4 max-w-[620px] text-base leading-relaxed text-ink-2 lg:text-lg">
            Аз 7 рӯзи ройгон оғоз кунед. Нарх бо сомонӣ ва барои як моҳ нишон дода шудааст.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </section>

        <Card shadow="lg" className="rounded-[22px] px-5 py-7 md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-[24px] leading-tight font-extrabold tracking-[-0.02em] lg:text-[30px]">Пардохт ҳоло фаъол нест</h2>
              <p className="mt-2 max-w-[560px] text-ink-2">
                Пардохти онлайн ҳанӯз пайваст нашудааст. Ҳоло барномаро бо маълумоти намунавӣ дида метавонед.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/app/new"
                className="flex items-center justify-center gap-2.5 rounded-tile border-[1.5px] border-ink bg-pen px-6 py-3.5 font-display text-base font-bold text-card shadow-hard hover:bg-[#2340c0] active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm"
              >
                <MicIcon size={20} strokeWidth={2.2} />
                Гап занед
              </Link>
              <Link
                href="/app"
                className="flex items-center justify-center rounded-tile border-[1.5px] border-ink bg-card px-6 py-3.5 font-display text-base font-bold text-ink shadow-hard hover:text-pen active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm"
              >
                Намунаро бинед
              </Link>
            </div>
          </div>
        </Card>

        <section>
          <h2 className="font-display text-[28px] leading-tight font-extrabold tracking-[-0.02em] lg:text-[36px]">Дар барнома чӣ ҳаст</h2>
          <HandNote className="mt-1 inline-block -rotate-1 text-[22px]">ҳамаашро ҳозир дида метавонед</HandNote>
          <ul className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
            {appFeatures.map((feature) => (
              <li key={feature.href}>
                <Link
                  href={feature.href}
                  className="group flex h-full flex-col rounded-card border-[1.5px] border-ink bg-card px-4 py-4 text-ink shadow-hard-sm hover:text-ink"
                >
                  <span className="font-display text-lg font-bold group-hover:text-pen">{feature.title}</span>
                  <span className="mt-1 text-sm text-ink-2">{feature.note}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
