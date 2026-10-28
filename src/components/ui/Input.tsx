import type { ComponentProps } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

type InputProps = ComponentProps<"input"> & {
  icon?: string;
  trailingIcon?: string;
  inputClassName?: string;
};

export function Input({ icon, trailingIcon, className, inputClassName, type = "text", ...rest }: InputProps) {
  return (
    <div className={cn("relative flex w-full items-center", className)}>
      {icon && <Icon name={icon} className="pointer-events-none absolute left-space-sm text-xl text-outline" />}
      <input
        type={type}
        className={cn(
          "w-full rounded-lg bg-surface-container-low py-1.5 font-body-sm text-body-sm text-on-surface outline-none placeholder:text-outline focus:bg-surface-container-lowest focus:ring-[1.5px] focus:ring-primary-container",
          icon ? "pl-9" : "pl-space-sm",
          trailingIcon ? "pr-9" : "pr-space-md",
          inputClassName,
        )}
        {...rest}
      />
      {trailingIcon && (
        <Icon name={trailingIcon} className="pointer-events-none absolute right-space-sm text-lg text-outline" />
      )}
    </div>
  );
}
