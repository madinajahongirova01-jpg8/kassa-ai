"use client";

import { useState, type FormEvent } from "react";
import { HandNote } from "@/components/daftar/HandNote";
import { useLocale, useT } from "@/components/i18n/I18nProvider";
import { Field, fieldClass, useSubmitGuard } from "@/components/nasiya/NasiyaForms";
import { PAYMENT_METHODS, type PaymentMethod } from "@/data/debts";
import { postJson } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { acceptPayment, parsePaymentAmount, paymentInputValue } from "@/lib/nasiyaForms";

type PaymentFormProps = {
  customerId: string;
  balance: number;
  onPaid: () => void;
  onCancel: () => void;
};

export function PaymentForm({ customerId, balance, onPaid, onCancel }: PaymentFormProps) {
  const t = useT();
  const locale = useLocale();
  const [amount, setAmount] = useState(() => paymentInputValue(balance));
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { pending, run } = useSubmitGuard();
  const amountId = `payment-amount-${customerId}`;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parsePaymentAmount(amount, balance, locale);
    setError(null);
    if ("error" in parsed) {
      setFieldError(parsed.error);
      return;
    }
    setFieldError(null);
    void run(async () => {
      const result = await acceptPayment(customerId, { amount, method }, balance, postJson, locale);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onPaid();
    });
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-label={t("nasiya.payment.title")}
      className="flex flex-col gap-3 rounded-tile border-[1.5px] border-ink bg-card px-3.5 py-3.5 shadow-hard-sm print:hidden"
    >
      <Field
        id={amountId}
        label={t("nasiya.payment.amount")}
        hint={t("nasiya.payment.upTo", { max: formatMoney(balance, { unit: false, locale }) })}
        error={fieldError ?? undefined}
      >
        <div className="flex gap-2">
          <input
            id={amountId}
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            readOnly={pending}
            autoComplete="off"
            autoFocus
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? `${amountId}-error` : undefined}
            className={cn(fieldClass, "min-w-0 flex-1")}
          />
          <button
            type="button"
            onClick={() => {
              setAmount(paymentInputValue(balance));
              setFieldError(null);
            }}
            disabled={pending}
            className="h-11 shrink-0 rounded-xl border-[1.5px] border-ink bg-card px-3 text-sm font-semibold whitespace-nowrap text-ink hover:text-pen disabled:text-ink-3"
          >
            {t("nasiya.payment.all")}
          </button>
        </div>
      </Field>
      <fieldset className="flex flex-col gap-1.5" disabled={pending}>
        <legend className="mb-1.5 text-sm font-semibold">{t("nasiya.payment.method")}</legend>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map((id) => (
            <label
              key={id}
              className={cn(
                "flex h-10 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-ink px-2 text-sm whitespace-nowrap has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-pen",
                method === id ? "bg-ink font-semibold text-card" : "bg-card text-ink hover:text-pen",
              )}
            >
              <input
                type="radio"
                name={`payment-method-${customerId}`}
                value={id}
                checked={method === id}
                onChange={() => setMethod(id)}
                className="sr-only"
              />
              {t(`nasiya.methods.${id}`)}
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <HandNote tone="red" role="alert" className="text-xl leading-tight">
          {error}
        </HandNote>
      )}
      <div className="flex gap-2.5">
        <button
          type="submit"
          disabled={pending}
          className="h-[46px] flex-1 rounded-tile border-[1.5px] border-ink bg-pen px-2 text-sm font-bold whitespace-nowrap text-card shadow-hard-sm active:translate-x-px active:translate-y-px active:shadow-none disabled:border-line-strong disabled:bg-line disabled:text-ink-3 disabled:shadow-none"
        >
          {pending ? t("nasiya.saving") : t("nasiya.payment.confirm")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="h-[46px] flex-1 rounded-tile border-[1.5px] border-ink bg-card px-2 text-sm font-semibold whitespace-nowrap text-ink hover:text-pen disabled:text-ink-3"
        >
          {t("nasiya.payment.cancel")}
        </button>
      </div>
    </form>
  );
}
