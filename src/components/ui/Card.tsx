import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
};

export function Card({ children, className, as: Tag = "div" }: CardProps) {
  return (
    <Tag className={cn("rounded-xl bg-surface-container-lowest p-space-md shadow-xs lg:p-space-lg", className)}>
      {children}
    </Tag>
  );
}

type CardHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function CardHeader({ title, subtitle, icon, action, className }: CardHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-space-sm pb-space-md", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-space-xs">
          {icon}
          <h2 className="font-headline-sm text-body-lg font-bold text-on-surface lg:font-headline-md lg:text-headline-md">
            {title}
          </h2>
        </div>
        {subtitle && <p className="font-body-sm text-body-sm text-outline">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
