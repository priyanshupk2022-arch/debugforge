import React from "react";

interface ShinyTextProps {
  text: string;
  className?: string;
  shimmerColor?: string;
}

export function ShinyText({
  text,
  className = "",
  shimmerColor = "#818CF8",
}: ShinyTextProps) {
  return (
    <span
      className={`inline-block bg-gradient-to-r from-neutral-200 via-white to-neutral-400 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%] font-semibold ${className}`}
    >
      {text}
    </span>
  );
}
