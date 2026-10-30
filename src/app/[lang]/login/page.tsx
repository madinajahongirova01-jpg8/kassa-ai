import type { Metadata } from "next";
import { LoginView } from "@/components/auth/LoginView";
import { SimpleHeader } from "@/components/daftar/SimpleHeader";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("auth.metaTitle") };
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SimpleHeader />
      <main className="mx-auto w-full max-w-[600px] min-w-0 flex-1 px-[18px] pt-8 pb-10 lg:pt-12">
        <LoginView />
      </main>
    </div>
  );
}
