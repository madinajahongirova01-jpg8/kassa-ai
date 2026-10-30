"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { Card } from "@/components/daftar/Card";
import { HandNote } from "@/components/daftar/HandNote";
import { PasswordInput } from "@/components/daftar/PasswordInput";
import { useT } from "@/components/i18n/I18nProvider";
import { authErrorKey, type AuthMode as Mode } from "@/lib/authText";
import { cn } from "@/lib/cn";

type SessionUser = { id: string; email: string; name: string | null; businessName: string | null };

const modes: Mode[] = ["login", "register"];

const fieldClass =
  "h-11 w-full rounded-full border-[1.5px] border-ink bg-card text-[15px] text-ink outline-none placeholder:text-ink-3 focus:border-pen";
const inputClass = `${fieldClass} px-4`;
const passwordClass = `${fieldClass} pl-4 pr-12`;
const labelClass = "flex flex-col gap-1.5 text-[13px] font-semibold text-ink";
const submitClass =
  "h-[54px] w-full rounded-card border-[1.5px] border-ink bg-pen font-display text-[15px] font-bold text-card shadow-hard active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm disabled:bg-pen-pale disabled:shadow-none";
const secondaryClass =
  "flex h-[54px] flex-1 items-center justify-center rounded-card border-[1.5px] border-ink bg-card text-[15px] font-semibold text-ink hover:text-pen";

// Only internal /app paths are allowed after login, so ?next= can't send the user to another site.
function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && /^\/app(?:[/?#]|$)/.test(next) ? next : "/app";
}

export function LoginView() {
  const router = useRouter();
  const t = useT();
  const passwordId = useId();
  const passwordHintId = useId();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { user?: SessionUser } | null) => active && setUser(body?.user ?? null))
      .catch(() => active && setUser(null));
    return () => {
      active = false;
    };
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const body = mode === "login" ? { email, password } : { email, password, businessName, ...(name.trim() ? { name } : {}) };
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setError(t(authErrorKey(response.status, mode)));
        setPending(false);
        return;
      }
      const session = await fetch("/api/auth/me", { cache: "no-store" });
      if (!session.ok) {
        setError(t("auth.errors.sessionLost"));
        setPending(false);
        return;
      }
      router.replace(nextPath());
    } catch {
      setError(t(authErrorKey(0, mode)));
      setPending(false);
    }
  }

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <div>
        <HandNote className="inline-block -rotate-2 text-[26px] lg:text-[30px]">{user ? t("auth.signedIn.note") : t(`auth.${mode}.note`)}</HandNote>
        <h1 className="mt-0.5 font-display text-[30px] font-extrabold lg:text-4xl">{user ? t("auth.signedIn.title") : t(`auth.${mode}.title`)}</h1>
      </div>

      {user ? (
        <Card className="flex flex-col gap-4 rounded-sheet p-[22px]">
          <p className="text-[15px] text-ink-2">{(user.businessName ?? user.name) ? `${user.businessName ?? user.name} · ${user.email}` : user.email}</p>
          <div className="flex gap-3">
            <button type="button" onClick={logout} disabled={pending} className={secondaryClass}>
              {t("auth.signedIn.logout")}
            </button>
            <Link
              href="/app"
              className="flex h-[54px] flex-2 items-center justify-center rounded-card border-[1.5px] border-ink bg-pen font-display text-[15px] font-bold text-card shadow-hard hover:text-card"
            >
              {t("auth.signedIn.toBook")}
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col gap-5 rounded-sheet p-[22px]">
          <div className="flex gap-2">
            {modes.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={mode === id}
                onClick={() => switchMode(id)}
                className={cn(
                  "h-[38px] rounded-full border-[1.5px] border-ink px-4",
                  mode === id ? "bg-ink font-semibold text-card" : "bg-card font-medium text-ink hover:text-pen",
                )}
              >
                {t(`auth.modes.${id}`)}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            {mode === "register" && (
              <label className={labelClass}>
                {t("auth.fields.businessName")}
                <input
                  type="text"
                  name="businessName"
                  autoComplete="organization"
                  required
                  maxLength={100}
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  className={inputClass}
                />
              </label>
            )}
            {mode === "register" && (
              <label className={labelClass}>
                {t("auth.fields.name")}
                <input type="text" name="name" autoComplete="name" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
              </label>
            )}
            <label className={labelClass}>
              {t("auth.fields.email")}
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </label>
            <div className={labelClass}>
              <label htmlFor={passwordId}>{t("auth.fields.password")}</label>
              <PasswordInput
                id={passwordId}
                name="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={mode === "register" ? 8 : undefined}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby={mode === "register" ? passwordHintId : undefined}
                className={passwordClass}
              />
              {mode === "register" && (
                <span id={passwordHintId} className="text-xs font-normal text-ink-2">
                  {t("auth.fields.passwordHint")}
                </span>
              )}
            </div>

            {error && (
              <p role="alert" className="text-sm font-semibold text-red">
                {error}
              </p>
            )}

            <button type="submit" disabled={pending} className={submitClass}>
              {pending ? t("auth.wait") : t(`auth.${mode}.submit`)}
            </button>
          </form>
        </Card>
      )}
    </section>
  );
}
