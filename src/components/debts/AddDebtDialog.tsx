"use client";

import { useState } from "react";
import { DebtDialog, dialogCancel, dialogInput, dialogLabel, dialogSubmit } from "@/components/debts/DebtDialog";
import { Icon } from "@/components/ui/Icon";
import { debtsToday, type DebtCustomer } from "@/data/debts";
import type { NewDebtRecord } from "@/lib/debtStore";
import { formatSomoni } from "@/lib/format";

export type NewDebtInput = NewDebtRecord;

type AddDebtDialogProps = {
  customers: { customer: DebtCustomer; balance: number }[];
  initialCustomerId: string | null;
  onClose: () => void;
  onConfirm: (input: NewDebtInput) => void;
};

const NEW = "new";

export function AddDebtDialog({ customers, initialCustomerId, onClose, onConfirm }: AddDebtDialogProps) {
  const [customerId, setCustomerId] = useState(initialCustomerId ?? customers[0]?.customer.id ?? NEW);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+992 ");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("2024-05-31");

  const isNew = customerId === NEW;
  const selected = customers.find((c) => c.customer.id === customerId);
  const value = Number(amount || 0);
  const overLimit = selected ? selected.balance + value > selected.customer.limit : false;
  const valid =
    value > 0 && description.trim().length > 0 && dueDate >= debtsToday && (!isNew || (name.trim().length > 1 && phone.replace(/\D/g, "").length >= 9));

  return (
    <DebtDialog
      title="Қарзи нав"
      icon="add_circle"
      onClose={onClose}
      onSubmit={() =>
        valid &&
        onConfirm({
          customerId: isNew ? null : customerId,
          name: name.trim(),
          phone: phone.trim(),
          description: description.trim(),
          amount: value,
          dueDate,
        })
      }
      footer={
        <>
          <button type="button" onClick={onClose} className={dialogCancel}>
            Бекор кардан
          </button>
          <button type="submit" disabled={!valid} className={dialogSubmit}>
            <Icon name="save" className="text-base" />
            Сабт кардан
          </button>
        </>
      }
    >
      <div>
        <label htmlFor="debt-customer" className={dialogLabel}>
          Муштарӣ
        </label>
        <select id="debt-customer" value={customerId} onChange={(event) => setCustomerId(event.target.value)} className={dialogInput}>
          {customers.map(({ customer, balance }) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} — {formatSomoni(balance)}
            </option>
          ))}
          <option value={NEW}>+ Муштарии нав</option>
        </select>
      </div>
      {isNew && (
        <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
          <div>
            <label htmlFor="debt-name" className={dialogLabel}>
              Ном ва насаб
            </label>
            <input id="debt-name" value={name} onChange={(event) => setName(event.target.value)} className={dialogInput} placeholder="Масалан: Ҷамила Назарова" />
          </div>
          <div>
            <label htmlFor="debt-phone" className={dialogLabel}>
              Телефон
            </label>
            <input id="debt-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className={dialogInput} />
          </div>
        </div>
      )}
      <div>
        <label htmlFor="debt-description" className={dialogLabel}>
          Мол / Хизматрасонӣ
        </label>
        <input
          id="debt-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={dialogInput}
          placeholder="Масалан: 1 халта орд"
        />
      </div>
      <div className="grid grid-cols-2 gap-space-sm">
        <div>
          <label htmlFor="debt-amount" className={dialogLabel}>
            Маблағ (смн)
          </label>
          <input
            id="debt-amount"
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/\D/g, "").slice(0, 7))}
            className={dialogInput}
            placeholder="0"
          />
        </div>
        <div>
          <label htmlFor="debt-due" className={dialogLabel}>
            Мӯҳлати пардохт
          </label>
          <input id="debt-due" type="date" min={debtsToday} value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={dialogInput} />
        </div>
      </div>
      {selected && overLimit && (
        <p className="flex items-center gap-1 rounded-lg bg-tertiary-fixed/60 px-3 py-2 font-body-sm text-body-sm text-on-tertiary-fixed">
          <Icon name="warning" className="text-base" />
          Қарз аз лимити {formatSomoni(selected.customer.limit)} зиёд мешавад.
        </p>
      )}
    </DebtDialog>
  );
}
