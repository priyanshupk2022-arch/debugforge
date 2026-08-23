import { useState, useEffect, useCallback } from "react";
import { api, HealthStatus } from "../lib/api";

export type ServiceHealthState = "connected" | "degraded" | "offline";

export function useHealth(pollIntervalMs: number = 20000) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to connect to health endpoint");
      // Honest offline representation
      setHealth({
        status: "offline",
        services: {
          database: "offline",
          bright_data: "offline",
          gemini_ai: "offline",
          chaos_proxy: "offline",
        },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const timer = setInterval(fetchHealth, pollIntervalMs);
    return () => clearInterval(timer);
  }, [fetchHealth, pollIntervalMs]);

  const brightDataState: ServiceHealthState =
    health?.services.bright_data === "connected"
      ? "connected"
      : health?.services.bright_data === "degraded"
      ? "degraded"
      : "offline";

  const geminiState: ServiceHealthState =
    health?.services.gemini_ai === "connected"
      ? "connected"
      : health?.services.gemini_ai === "degraded"
      ? "degraded"
      : "offline";

  return {
    health,
    brightDataState,
    geminiState,
    isLoading,
    error,
    refresh: fetchHealth,
  };
}
