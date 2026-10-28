import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminMobileNav } from "@/components/layout/AdminMobileNav";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen bg-surface lg:pl-72">
      <AdminSidebar />
      <AdminHeader />
      <main className="min-h-screen w-full bg-surface px-gutter pt-16 pb-24 lg:px-8 lg:pb-6">{children}</main>
      <AdminMobileNav />
    </div>
  );
}
