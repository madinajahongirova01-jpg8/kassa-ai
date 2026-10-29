"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/daftar/Card";
import { HandNote } from "@/components/daftar/HandNote";
import { cn } from "@/lib/cn";

type Mode = "login" | "register";
type SessionUser = { id: string; email: string; name: string | null; businessName: string | null };

const modes: { id: Mode; label: string }[] = [
  { id: "login", label: "Даромадан" },
  { id: "register", label: "Бақайдгирӣ" },
];

const copy: Record<Mode, { note: string; title: string; submit: string }> = {
  login: { note: "хуш омадед!", title: "Ба дафтар дароед", submit: "Даромадан →" },
  register: { note: "дафтари нав", title: "Ҳисоб кушоед", submit: "Сабт шудан →" },
};

const inputClass =
  "h-11 w-full rounded-full border-[1.5px] border-ink bg-card px-4 text-[15px] text-ink outline-none placeholder:text-ink-3 focus:border-pen";
const labelClass = "flex flex-col gap-1.5 text-[13px] font-semibold text-ink";
const submitClass =
  "h-[54px] w-full rounded-card border-[1.5px] border-ink bg-pen font-display text-[15px] font-bold text-card shadow-hard active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm disabled:bg-pen-pale disabled:shadow-none";
const secondaryClass =
  "flex h-[54px] flex-1 items-center justify-center rounded-card border-[1.5px] border-ink bg-card text-[15px] font-semibold text-ink hover:text-pen";

function errorText(status: number, mode: Mode) {
  if (status === 401 && mode === "login") return "Почта ё парол нодуруст аст.";
  if (status === 429) return "Кӯшишҳо зиёд шуданд. Як дақиқа сабр кунед ва боз кӯшиш кунед.";
  if (status === 409) return "Ин почта аллакай сабт шудааст. Ба ҷои он дароед.";
  if (status === 400) return mode === "register" ? "Почта ва номи тиҷоратро санҷед. Парол бояд аз 8 то 128 аломат бошад." : "Почта ва паролро санҷед.";
  if (status === 403) return "Дархост рад шуд. Саҳифаро нав кунед ва боз кӯшиш кунед.";
  return "Сервер ҳоло ҷавоб намедиҳад. Каме баъд боз кӯшиш кунед.";
}

// Only internal /app paths are allowed after login, so ?next= can't send the user to another site.
function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && /^\/app(?:[/?#]|$)/.test(next) ? next : "/app";
}

export function LoginView() {
  const router = useRouter();
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
        setError(errorText(response.status, mode));
        return;
      }
      setPassword("");
      router.replace(nextPath());
    } catch {
      setError(errorText(0, mode));
    } finally {
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

  const text = copy[mode];

  return (
    <section className="flex flex-col gap-5">
      <div>
        <HandNote className="inline-block -rotate-2 text-[26px] lg:text-[30px]">{user ? "салом!" : text.note}</HandNote>
        <h1 className="mt-0.5 font-display text-[30px] font-extrabold lg:text-4xl">{user ? "Шумо дохил шудаед" : text.title}</h1>
      </div>

      {user ? (
        <Card className="flex flex-col gap-4 rounded-sheet p-[22px]">
          <p className="text-[15px] text-ink-2">{(user.businessName ?? user.name) ? `${user.businessName ?? user.name} · ${user.email}` : user.email}</p>
          <div className="flex gap-3">
            <button type="button" onClick={logout} disabled={pending} className={secondaryClass}>
              Баромадан
            </button>
            <Link
              href="/app"
              className="flex h-[54px] flex-2 items-center justify-center rounded-card border-[1.5px] border-ink bg-pen font-display text-[15px] font-bold text-card shadow-hard hover:text-card"
            >
              Ба дафтар →
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col gap-5 rounded-sheet p-[22px]">
          <div className="flex gap-2">
            {modes.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={mode === item.id}
                onClick={() => switchMode(item.id)}
                className={cn(
                  "h-[38px] rounded-full border-[1.5px] border-ink px-4",
                  mode === item.id ? "bg-ink font-semibold text-card" : "bg-card font-medium text-ink hover:text-pen",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            {mode === "register" && (
              <label className={labelClass}>
                Номи тиҷорат
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
                Ном (ихтиёрӣ)
                <input type="text" name="name" autoComplete="name" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
              </label>
            )}
            <label className={labelClass}>
              Почтаи электронӣ
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
            <label className={labelClass}>
              Парол
              <input
                type="password"
                name="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={mode === "register" ? 8 : undefined}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
              />
              {mode === "register" && <span className="text-xs font-normal text-ink-2">камаш 8 аломат</span>}
            </label>

            {error && (
              <p role="alert" className="text-sm font-semibold text-red">
                {error}
              </p>
            )}

            <button type="submit" disabled={pending} className={submitClass}>
              {pending ? "Интизор шавед…" : text.submit}
            </button>
          </form>
        </Card>
      )}
    </section>
  );
}
