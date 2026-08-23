import React from "react";

export function MissingFieldTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center text-xs italic text-[var(--text-tertiary)] font-mono ${className}`}
      aria-label="Field not extracted by scraper"
    >
      — not extracted
    </span>
  );
}
