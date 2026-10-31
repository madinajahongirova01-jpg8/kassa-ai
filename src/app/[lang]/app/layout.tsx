import { AppTopBar } from "@/components/daftar/AppTopBar";
import { BottomNav } from "@/components/daftar/BottomNav";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export default function AppLayout({ children }: LayoutProps<"/[lang]/app">) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[600px] flex-col gap-4 px-[18px] pt-[18px] pb-[132px] lg:max-w-[1440px] lg:gap-5 lg:px-7 lg:py-[22px]">
      <AppTopBar />
      <InstallPrompt />
      <main className="min-w-0 flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}
