"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { HandNote } from "@/components/daftar/HandNote";
import type { DebtCustomer } from "@/data/debts";
import type { ApiCustomer } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import {
  createCustomer,
  createDebt,
  MAX_CUSTOMER_NAME,
  MAX_DEBT_NOTE,
  updateCustomer,
  validateCustomer,
  validateDebt,
  type CustomerErrors,
  type CustomerForm as CustomerFormValues,
  type DebtErrors,
  type FormResult,
} from "@/lib/nasiyaForms";

const fieldClass =
  "h-11 w-full rounded-xl border-[1.5px] border-ink bg-card px-3.5 text-[15px] text-ink outline-none placeholder:text-ink-3 focus:border-pen aria-invalid:border-red";

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
        {hint && <span className="ml-1.5 font-normal text-ink-3">{hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-red">
          {error}
        </p>
      )}
    </div>
  );
}

function FormShell({ title, onSubmit, onClose, pending, submitText, error, children }: {
  title: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  pending: boolean;
  submitText: string;
  error: string | null;
  children: ReactNode;
}) {
  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-label={title}
      className="flex flex-col gap-4 rounded-sheet border-[1.5px] border-ink bg-card px-[18px] py-5 shadow-hard lg:px-[22px]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-[19px] font-bold">{title}</h2>
        <button type="button" onClick={onClose} disabled={pending} className="text-sm font-semibold text-ink-2 hover:text-pen disabled:text-ink-3">
          ✕ Пӯшидан
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
      {error && (
        <HandNote tone="red" role="alert" className="text-xl leading-tight">
          {error}
        </HandNote>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-[46px] rounded-tile border-[1.5px] border-ink bg-pen px-5 font-display text-sm font-bold text-card shadow-hard-sm active:translate-x-px active:translate-y-px active:shadow-none disabled:border-line-strong disabled:bg-line disabled:text-ink-3 disabled:shadow-none sm:self-start"
      >
        {pending ? "Сабт мешавад…" : submitText}
      </button>
    </form>
  );
}

function useSubmitGuard() {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  async function run(task: () => Promise<void>) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      await task();
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return { pending, run };
}

type CustomerFormProps = {
  title: string;
  submitText: string;
  idPrefix: string;
  initial: CustomerFormValues;
  save: (form: CustomerFormValues) => Promise<FormResult<ApiCustomer>>;
  onSaved: (id: string) => void;
  onClose: () => void;
};

function CustomerForm({ title, submitText, idPrefix, initial, save, onSaved, onClose }: CustomerFormProps) {
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [error, setError] = useState<string | null>(null);
  const { pending, run } = useSubmitGuard();
  const nameId = `${idPrefix}-name`;
  const phoneId = `${idPrefix}-phone`;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = { name, phone };
    const found = validateCustomer(form);
    setErrors(found);
    setError(null);
    if (found.name || found.phone) return;
    void run(async () => {
      const result = await save(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved(result.data.id);
    });
  }

  return (
    <FormShell title={title} onSubmit={submit} onClose={onClose} pending={pending} submitText={submitText} error={error}>
      <Field id={nameId} label="Номи муштарӣ" error={errors.name}>
        <input
          id={nameId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={MAX_CUSTOMER_NAME}
          autoComplete="off"
          autoFocus
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${nameId}-error` : undefined}
          className={fieldClass}
        />
      </Field>
      <Field id={phoneId} label="Телефон" hint="ихтиёрӣ" error={errors.phone}>
        <input
          id={phoneId}
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+992 90 123 45 67"
          autoComplete="off"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? `${phoneId}-error` : undefined}
          className={fieldClass}
        />
      </Field>
    </FormShell>
  );
}

export function NewCustomerForm({ onCreated, onClose }: { onCreated: (id: string) => void; onClose: () => void }) {
  return (
    <CustomerForm
      title="Муштарии нав"
      submitText="Муштариро илова кунед"
      idPrefix="customer"
      initial={{ name: "", phone: "" }}
      save={(form) => createCustomer(form)}
      onSaved={onCreated}
      onClose={onClose}
    />
  );
}

export function EditCustomerForm({ customer, onSaved, onClose }: { customer: DebtCustomer; onSaved: (id: string) => void; onClose: () => void }) {
  return (
    <CustomerForm
      title="Таҳрири муштарӣ"
      submitText="Тағйиротро нигоҳ доред"
      idPrefix="edit-customer"
      initial={{ name: customer.name, phone: customer.phone }}
      save={(form) => updateCustomer(customer.id, form)}
      onSaved={onSaved}
      onClose={onClose}
    />
  );
}

type NewDebtFormProps = {
  customers: DebtCustomer[];
  initialCustomerId: string | undefined;
  today: string;
  onCreated: (customerId: string) => void;
  onClose: () => void;
};

export function NewDebtForm({ customers, initialCustomerId, today, onCreated, onClose }: NewDebtFormProps) {
  const [customerId, setCustomerId] = useState(initialCustomerId ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [errors, setErrors] = useState<DebtErrors>({});
  const [error, setError] = useState<string | null>(null);
  const { pending, run } = useSubmitGuard();
  const sorted = [...customers].sort((a, b) => a.name.localeCompare(b.name));
  const ids = customers.map((customer) => customer.id);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = { customerId, amount, note, dueOn };
    const found = validateDebt(form, ids, today);
    setErrors(found);
    setError(null);
    if (Object.keys(found).length > 0) return;
    void run(async () => {
      const result = await createDebt(form, ids, today);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onCreated(customerId);
    });
  }

  if (customers.length === 0) {
    return (
      <div role="status" className="flex items-center justify-between gap-3 rounded-sheet border-[1.5px] border-ink bg-card px-[18px] py-4 shadow-hard">
        <HandNote tone="muted" className="text-xl leading-tight">
          барои қарз аввал муштарии нав илова кунед
        </HandNote>
        <button type="button" onClick={onClose} className="shrink-0 text-sm font-semibold text-ink-2 hover:text-pen">
          ✕ Пӯшидан
        </button>
      </div>
    );
  }

  return (
    <FormShell title="Қарзи нав" onSubmit={submit} onClose={onClose} pending={pending} submitText="Қарзро сабт кунед" error={error}>
      <Field id="debt-customer" label="Муштарӣ" error={errors.customerId}>
        <select
          id="debt-customer"
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
          aria-invalid={Boolean(errors.customerId)}
          aria-describedby={errors.customerId ? "debt-customer-error" : undefined}
          className={cn(fieldClass, !customerId && "text-ink-3")}
        >
          <option value="">— интихоб кунед —</option>
          {sorted.map((customer) => (
            <option key={customer.id} value={customer.id} className="text-ink">
              {customer.phone ? `${customer.name} · ${customer.phone}` : customer.name}
            </option>
          ))}
        </select>
      </Field>
      <Field id="debt-amount" label="Маблағ" hint="сомонӣ" error={errors.amount}>
        <input
          id="debt-amount"
          inputMode="numeric"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="100"
          autoComplete="off"
          aria-invalid={Boolean(errors.amount)}
          aria-describedby={errors.amount ? "debt-amount-error" : undefined}
          className={fieldClass}
        />
      </Field>
      <Field id="debt-note" label="Шарҳ" hint="ихтиёрӣ" error={errors.note}>
        <input
          id="debt-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={MAX_DEBT_NOTE}
          placeholder="масалан: орд, 1 халта"
          autoComplete="off"
          aria-invalid={Boolean(errors.note)}
          aria-describedby={errors.note ? "debt-note-error" : undefined}
          className={fieldClass}
        />
      </Field>
      <Field id="debt-due" label="Санаи баргардонидан" hint="ихтиёрӣ" error={errors.dueOn}>
        <input
          id="debt-due"
          type="date"
          value={dueOn}
          min={today}
          onChange={(event) => setDueOn(event.target.value)}
          aria-invalid={Boolean(errors.dueOn)}
          aria-describedby={errors.dueOn ? "debt-due-error" : undefined}
          className={fieldClass}
        />
      </Field>
    </FormShell>
  );
}
