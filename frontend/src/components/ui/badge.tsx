import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius-xs)] text-xs font-medium tracking-wide transition-colors uppercase select-none border",
  {
    variants: {
      variant: {
        verified:
          "bg-[var(--verified-tint)] text-[var(--verified)] border-[var(--verified-border)]",
        degraded:
          "bg-[var(--degraded-tint)] text-[var(--degraded)] border-[var(--degraded-border)]",
        broken:
          "bg-[var(--broken-tint)] text-[var(--broken)] border-[var(--broken-border)]",
        simulated:
          "bg-[var(--simulated-tint)] text-[var(--simulated)] border-[var(--simulated-border)]",
        information:
          "bg-[var(--information-tint)] text-[var(--information)] border-[rgba(70,100,122,0.2)]",
        neutral:
          "bg-[var(--surface-sunken)] text-[var(--text-secondary)] border-[var(--border-default)]",
        outline:
          "bg-transparent text-[var(--text-secondary)] border-[var(--border-default)]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            variant === "verified" && "bg-[var(--verified)]",
            variant === "degraded" && "bg-[var(--degraded)]",
            variant === "broken" && "bg-[var(--broken)]",
            variant === "simulated" && "bg-[var(--simulated)]",
            variant === "information" && "bg-[var(--information)]",
            (!variant || variant === "neutral" || variant === "outline") &&
              "bg-[var(--text-tertiary)]"
          )}
        />
      )}
      <span>{children}</span>
    </div>
  );
}

export { Badge, badgeVariants };
