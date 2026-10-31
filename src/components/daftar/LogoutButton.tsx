"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export function LogoutButton({ compact = false, className }: { compact?: boolean; className?: string }) {
  const t = useT();
  const router = useRouter();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const label = t("auth.signedIn.logout");

  async function logout() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    const ok = await fetch("/api/auth/logout", { method: "POST" }).then(
      (response) => response.ok,
      () => false,
    );
    if (ok) {
      router.replace("/login");
      router.refresh();
      return;
    }
    busy.current = false;
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      aria-label={compact ? label : undefined}
      title={compact ? label : undefined}
      className={cn(
        "flex h-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink bg-card text-sm font-semibold text-ink hover:text-pen disabled:text-ink-3 print:hidden",
        compact ? "w-9" : "px-4",
        className,
      )}
    >
      {compact ? <Icon name="logout" className="text-[20px]" /> : label}
    </button>
  );
}
