import { AppTopBar } from "@/components/daftar/AppTopBar";
import { BottomNav } from "@/components/daftar/BottomNav";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[600px] flex-col gap-4 px-[18px] pt-[18px] pb-[132px] xl:max-w-[1600px] xl:gap-5 xl:px-7 xl:py-[22px]">
      <AppTopBar />
      <main className="min-w-0 flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}
