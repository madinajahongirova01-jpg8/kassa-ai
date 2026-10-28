import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

type Option<T extends string> = { value: T; label: string };

type FilterSelectProps<T extends string> = {
  label: string;
  icon?: string;
  iconClassName?: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  display: string;
  className?: string;
  bold?: boolean;
  caret?: string;
};

export function FilterSelect<T extends string>({
  label,
  icon,
  iconClassName,
  value,
  options,
  onChange,
  display,
  className,
  bold = false,
  caret = "arrow_drop_down",
}: FilterSelectProps<T>) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 font-body-sm text-body-sm text-on-surface transition-colors focus-within:ring-[1.5px] focus-within:ring-primary-container hover:bg-surface-container-high",
        className,
      )}
    >
      {icon && <Icon name={icon} className={cn("text-base", iconClassName)} />}
      <span className={cn("whitespace-nowrap", bold && "font-semibold")}>{display}</span>
      <Icon name={caret} className="text-sm text-outline" />
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
