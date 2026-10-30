"use client";

import { useState, type ComponentProps } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

type PasswordInputProps = Omit<ComponentProps<"input">, "type"> & {
  id: string;
};

export function PasswordInput({ id, className, ...rest }: PasswordInputProps) {
  const t = useT();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <input id={id} type={visible ? "text" : "password"} className={cn("[&::-ms-reveal]:hidden", className)} {...rest} />
      <button
        type="button"
        aria-controls={id}
        aria-label={visible ? t("auth.fields.hidePassword") : t("auth.fields.showPassword")}
        onClick={() => setVisible((value) => !value)}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-full text-ink-2 outline-none hover:text-pen focus-visible:text-pen focus-visible:ring-2 focus-visible:ring-pen focus-visible:ring-inset"
      >
        <Icon name={visible ? "visibility_off" : "visibility"} className="text-[22px]" />
      </button>
    </div>
  );
}
