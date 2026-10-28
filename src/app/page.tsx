import { LandingCta } from "@/components/landing/LandingCta";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingSteps } from "@/components/landing/LandingSteps";

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1280px] flex-col gap-14 overflow-x-clip px-4 pt-[18px] pb-10 lg:gap-24 lg:px-8 lg:pt-[22px]">
      <LandingHeader />
      <main className="flex flex-col gap-16 lg:gap-24">
        <LandingHero />
        <LandingSteps />
        <LandingFeatures />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
