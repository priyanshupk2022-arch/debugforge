import React from "react";

interface ConfidenceGaugeProps {
  confidence: number; // 0 to 1.0
  size?: number;
}

export function ConfidenceGauge({ confidence, size = 64 }: ConfidenceGaugeProps) {
  const percent = Math.round(confidence * 100);
  const strokeWidth = 5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  const strokeColor =
    percent >= 85
      ? "var(--verified)"
      : percent >= 70
      ? "var(--degraded)"
      : "var(--broken)";

  return (
    <div
      className="relative flex items-center justify-center font-mono select-none"
      style={{ width: size, height: size }}
      title={`Repair Confidence: ${percent}%`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border-default)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-[var(--text-primary)]">
        {percent}%
      </span>
    </div>
  );
}
