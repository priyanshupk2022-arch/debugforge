import React from "react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 md:p-12 border border-dashed border-[var(--border-default)] rounded-[var(--radius-md)] bg-[var(--bg-secondary)] ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] mb-4 shadow-[var(--shadow-1)]">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-1">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
