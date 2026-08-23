import React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface HealthTrendProps {
  health: number; // 0 to 1.0
  className?: string;
}

export function HealthTrend({ health, className = "" }: HealthTrendProps) {
  // Generate a smooth illustrative 5-point trend ending at current health
  const base = Math.max(0.4, Math.min(1.0, health));
  const data = [
    { v: Math.max(0.3, base - 0.15) },
    { v: Math.max(0.35, base - 0.08) },
    { v: Math.max(0.4, base - 0.05) },
    { v: Math.max(0.4, base - 0.02) },
    { v: base },
  ];

  const strokeColor =
    health >= 0.8
      ? "var(--verified)"
      : health >= 0.5
      ? "var(--degraded)"
      : "var(--broken)";

  return (
    <div className={`h-8 w-24 ${className}`} title={`Health Score: ${Math.round(health * 100)}%`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={strokeColor}
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
