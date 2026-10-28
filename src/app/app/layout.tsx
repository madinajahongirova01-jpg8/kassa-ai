import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="min-h-screen bg-surface lg:pl-72">
      <AppSidebar />
      <AppHeader />
      <main className="relative min-h-screen bg-surface pt-16 pb-28 lg:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
