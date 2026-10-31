"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Card } from "@/components/daftar/Card";
import { HandNote } from "@/components/daftar/HandNote";
import { PasswordInput } from "@/components/daftar/PasswordInput";
import { useLocale, useT } from "@/components/i18n/I18nProvider";
import { Field, fieldClass, useSubmitGuard } from "@/components/nasiya/NasiyaForms";
import type { ApiMe } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import {
  changePassword,
  MAX_PASSWORD,
  MAX_PROFILE_TEXT,
  saveProfile,
  validatePassword,
  validateProfile,
  type PasswordErrors,
  type ProfileErrors,
} from "@/lib/settingsForms";

const submitClass =
  "h-[46px] rounded-tile border-[1.5px] border-ink bg-pen px-5 font-display text-sm font-bold text-card shadow-hard-sm active:translate-x-px active:translate-y-px active:shadow-none disabled:border-line-strong disabled:bg-line disabled:text-ink-3 disabled:shadow-none sm:self-start";

function Section({ title, label, onSubmit, children }: { title: string; label: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: ReactNode }) {
  return (
    <Card shadow="md" className="rounded-sheet px-[18px] py-5 lg:px-[22px]">
      <form noValidate onSubmit={onSubmit} aria-label={label} className="flex flex-col gap-4">
        <h2 className="font-display text-[19px] font-bold">{title}</h2>
        {children}
      </form>
    </Card>
  );
}

function Status({ error, saved }: { error: string | null; saved: string | null }) {
  if (error) {
    return (
      <p role="alert" className="text-sm font-medium text-red">
        {error}
      </p>
    );
  }
  if (saved) {
    return (
      <p role="status" className="text-sm font-semibold text-green">
        ✓ {saved}
      </p>
    );
  }
  return null;
}

function ProfileForm({ user }: { user: ApiMe["user"] }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const { pending, run } = useSubmitGuard();
  const [businessName, setBusinessName] = useState(user.businessName ?? "");
  const [name, setName] = useState(user.name ?? "");
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const busy = pending || refreshing;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = { businessName, name };
    const found = validateProfile(form, locale);
    setErrors(found);
    setError(null);
    setSaved(null);
    if (found.businessName || found.name) return;
    void run(async () => {
      const result = await saveProfile(form, undefined, locale);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(t("settings.profile.saved"));
      startRefresh(() => router.refresh());
    });
  }

  return (
    <Section title={t("settings.profile.title")} label={t("settings.profile.title")} onSubmit={submit}>
      <Field id="settings-business" label={t("settings.profile.businessName")} error={errors.businessName}>
        <input
          id="settings-business"
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
          readOnly={busy}
          maxLength={MAX_PROFILE_TEXT}
          autoComplete="organization"
          aria-invalid={Boolean(errors.businessName)}
          aria-describedby={errors.businessName ? "settings-business-error" : undefined}
          className={fieldClass}
        />
      </Field>
      <Field id="settings-name" label={t("settings.profile.name")} hint={t("settings.profile.optional")} error={errors.name}>
        <input
          id="settings-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          readOnly={busy}
          maxLength={MAX_PROFILE_TEXT}
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "settings-name-error" : undefined}
          className={fieldClass}
        />
      </Field>
      <Field id="settings-email" label={t("settings.profile.email")} hint={t("settings.profile.emailNote")}>
        <input id="settings-email" value={user.email} readOnly disabled className={cn(fieldClass, "bg-paper text-ink-2")} />
      </Field>
      <Status error={error} saved={saved} />
      <button type="submit" disabled={busy} className={submitClass}>
        {busy ? t("settings.saving") : t("settings.profile.save")}
      </button>
    </Section>
  );
}

function PasswordForm() {
  const t = useT();
  const locale = useLocale();
  const { pending, run } = useSubmitGuard();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = { current, next, repeat };
    const found = validatePassword(form, locale);
    setErrors(found);
    setError(null);
    setSaved(null);
    if (Object.keys(found).length > 0) return;
    void run(async () => {
      const result = await changePassword(form, undefined, locale);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCurrent("");
      setNext("");
      setRepeat("");
      setSaved(t("settings.password.saved"));
    });
  }

  const passwordField = (id: string, label: string, value: string, onChange: (value: string) => void, fieldError: string | undefined, autoComplete: string, hint?: string) => (
    <Field id={id} label={label} hint={hint} error={fieldError}>
      <PasswordInput
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={pending}
        maxLength={MAX_PASSWORD}
        autoComplete={autoComplete}
        aria-invalid={Boolean(fieldError)}
        aria-describedby={fieldError ? `${id}-error` : undefined}
        className={cn(fieldClass, "pr-12")}
      />
    </Field>
  );

  return (
    <Section title={t("settings.password.title")} label={t("settings.password.title")} onSubmit={submit}>
      {passwordField("settings-current", t("settings.password.current"), current, setCurrent, errors.current, "current-password")}
      {passwordField("settings-new", t("settings.password.next"), next, setNext, errors.next, "new-password", t("settings.password.nextHint"))}
      {passwordField("settings-repeat", t("settings.password.repeat"), repeat, setRepeat, errors.repeat, "new-password")}
      <Status error={error} saved={saved} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? t("settings.saving") : t("settings.password.save")}
      </button>
    </Section>
  );
}

export function SettingsView({ user }: { user: ApiMe["user"] }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-5">
      <HandNote className="inline-block -rotate-2 text-[26px] lg:text-[30px]">{t("settings.title")}</HandNote>
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <ProfileForm user={user} />
        <PasswordForm />
      </div>
    </div>
  );
}
