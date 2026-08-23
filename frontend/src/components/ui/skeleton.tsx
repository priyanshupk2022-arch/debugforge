import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-busy="true"
      className={cn(
        "animate-pulse rounded-[var(--radius-xs)] bg-[var(--border-default)] opacity-60",
        className
      )}
      {...props}
    />
  );
}
