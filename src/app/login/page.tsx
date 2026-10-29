import type { Metadata } from "next";
import { LoginView } from "@/components/auth/LoginView";
import { Logo } from "@/components/daftar/Logo";

export const metadata: Metadata = {
  title: "Даромадан — Kassa AI",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[600px] flex-col gap-8 px-[18px] pt-[18px] pb-10 lg:gap-12 lg:pt-[22px]">
      <header className="flex items-center justify-between gap-3">
        <Logo href="/" />
      </header>
      <main className="min-w-0 flex-1">
        <LoginView />
      </main>
    </div>
  );
}
