"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/daftar/Card";
import { useLocale, useT } from "@/components/i18n/I18nProvider";
import { Field, fieldClass, useSubmitGuard } from "@/components/nasiya/NasiyaForms";
import { businessToday } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { LINK_CODE_MINUTES, linkTelegram, MAX_LINK_CODE, unlinkTelegram, validateLinkCode, type TelegramLinkStatus } from "@/lib/telegramLink";

const buttonClass =
  "h-[46px] rounded-tile border-[1.5px] border-ink px-5 font-display text-sm font-bold shadow-hard-sm active:translate-x-px active:translate-y-px active:shadow-none disabled:border-line-strong disabled:bg-line disabled:text-ink-3 disabled:shadow-none";
const primaryClass = `${buttonClass} bg-pen text-card`;
const secondaryClass = `${buttonClass} bg-card text-ink`;

function Message({ error, saved }: { error: string | null; saved: string | null }) {
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

/** Links the signed-in account to its Telegram chat with a one-time code from the bot's /link command. */
export function TelegramLinkCard({ initial }: { initial: TelegramLinkStatus | null }) {
  const t = useT();
  const locale = useLocale();
  const { pending, run } = useSubmitGuard();
  const [status, setStatus] = useState(initial);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function link(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateLinkCode(code, locale);
    setCodeError(found);
    setError(null);
    setSaved(null);
    if (found) return;
    void run(async () => {
      const result = await linkTelegram(code, undefined, locale);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCode("");
      setStatus(result.status);
      setSaved(t("settings.telegram.success"));
    });
  }

  function unlink() {
    setError(null);
    setSaved(null);
    void run(async () => {
      const result = await unlinkTelegram(undefined, locale);
      setConfirming(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStatus({ linked: false, linkedAt: null });
      setSaved(t("settings.telegram.unlinked"));
    });
  }

  return (
    <Card shadow="md" className="rounded-sheet px-[18px] py-5 lg:px-[22px]">
      <section aria-labelledby="settings-telegram-title" className="flex flex-col gap-4">
        <h2 id="settings-telegram-title" className="font-display text-[19px] font-bold">
          {t("settings.telegram.title")}
        </h2>
        <p className="text-sm text-ink-2">{t("settings.telegram.intro")}</p>

        {status === null && <p className="text-sm font-medium text-red">{t("settings.telegram.unavailable")}</p>}

        {status?.linked && (
          <div className="flex flex-col gap-4">
            <p className="text-sm">
              <span className="font-semibold text-green">✓ {t("settings.telegram.linked")}</span>
              {status.linkedAt && (
                <span className="ml-1.5 text-ink-3">
                  {t("settings.telegram.linkedSince", { date: formatDate(businessToday(new Date(status.linkedAt)), locale) })}
                </span>
              )}
            </p>
            <p className="text-sm text-ink-2">{t("settings.telegram.linkedText")}</p>
            <Message error={error} saved={saved} />
            {confirming ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold">{t("settings.telegram.unlinkConfirm")}</p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={unlink} disabled={pending} className={primaryClass}>
                    {pending ? t("settings.telegram.unlinking") : t("settings.telegram.unlinkYes")}
                  </button>
                  <button type="button" onClick={() => setConfirming(false)} disabled={pending} className={secondaryClass}>
                    {t("settings.telegram.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirming(true)} className={`${secondaryClass} sm:self-start`}>
                {t("settings.telegram.unlink")}
              </button>
            )}
          </div>
        )}

        {status?.linked === false && (
          <form noValidate onSubmit={link} aria-label={t("settings.telegram.title")} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-semibold">{t("settings.telegram.stepsLabel")}</p>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-2">
                <li>{t("settings.telegram.step1")}</li>
                <li>{t("settings.telegram.step2", { minutes: LINK_CODE_MINUTES })}</li>
                <li>{t("settings.telegram.step3")}</li>
              </ol>
            </div>
            <Field id="settings-telegram-code" label={t("settings.telegram.code")} hint={t("settings.telegram.codeHint")} error={codeError}>
              <input
                id="settings-telegram-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                readOnly={pending}
                maxLength={MAX_LINK_CODE}
                autoComplete="one-time-code"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="ABCD-EFGH"
                aria-invalid={Boolean(codeError)}
                aria-describedby={codeError ? "settings-telegram-code-error" : undefined}
                className={`${fieldClass} font-mono uppercase tracking-wider`}
              />
            </Field>
            <Message error={error} saved={saved} />
            <button type="submit" disabled={pending} className={`${primaryClass} sm:self-start`}>
              {pending ? t("settings.telegram.linking") : t("settings.telegram.link")}
            </button>
          </form>
        )}
      </section>
    </Card>
  );
}
