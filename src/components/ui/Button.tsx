import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

type Variant = "primary" | "tertiary" | "accent" | "secondary" | "surface" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary shadow-sm hover:bg-primary/95",
  tertiary: "bg-tertiary text-on-tertiary shadow-sm hover:opacity-95",
  accent: "bg-tertiary-container text-on-tertiary-container shadow-sm hover:opacity-95",
  secondary: "bg-surface-container-high text-on-surface hover:bg-surface-container-highest",
  surface: "bg-surface-container-lowest text-primary shadow-xs hover:bg-primary hover:text-on-primary",
  ghost: "text-outline hover:text-on-surface",
  outline:
    "border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low",
};

const sizes: Record<Size, string> = {
  sm: "gap-1 rounded-sm px-2.5 py-1 text-xs font-semibold",
  md: "gap-space-xs rounded-lg px-space-md py-2 font-headline-sm text-headline-sm",
  lg: "gap-1.5 rounded-lg px-space-md py-2.5 font-headline-sm text-headline-sm",
};

type StyleProps = {
  variant?: Variant;
  size?: Size;
  icon?: string;
  iconClassName?: string;
  className?: string;
  children?: ReactNode;
};

function buttonClasses({ variant = "primary", size = "md", className }: StyleProps) {
  return cn("inline-flex items-center justify-center transition-all", variants[variant], sizes[size], className);
}

function ButtonContent({ size = "md", icon, iconClassName, children }: StyleProps) {
  return (
    <>
      {icon && <Icon name={icon} className={cn(size === "sm" ? "text-xs" : "text-lg", iconClassName)} />}
      {children}
    </>
  );
}

type ButtonProps = StyleProps & Omit<ComponentProps<"button">, keyof StyleProps>;

export function Button({
  variant,
  size,
  icon,
  iconClassName,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buttonClasses({ variant, size, className })} {...rest}>
      <ButtonContent size={size} icon={icon} iconClassName={iconClassName}>
        {children}
      </ButtonContent>
    </button>
  );
}

type ButtonLinkProps = StyleProps & { href: string };

export function ButtonLink({ href, variant, size, icon, iconClassName, className, children }: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClasses({ variant, size, className })}>
      <ButtonContent size={size} icon={icon} iconClassName={iconClassName}>
        {children}
      </ButtonContent>
    </Link>
  );
}
