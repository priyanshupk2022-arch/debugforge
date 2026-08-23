import { useState, useEffect, useCallback } from "react";
import { api, TargetEntity } from "../lib/api";

export const DEFAULT_DEMO_TARGETS: TargetEntity[] = [
  {
    id: "target-demo-exploitdb",
    name: "Exploit-DB Advisory Portal",
    url: "https://www.exploit-db.com/exploits/advisories",
    domain: "exploit-db.com",
    status: "READY",
    health: 0.96,
    is_demo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "target-demo-cve",
    name: "NVD Global Vulnerability Catalog",
    url: "https://nvd.nist.gov/vuln/search",
    domain: "nvd.nist.gov",
    status: "READY",
    health: 1.0,
    is_demo: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export function useTargets() {
  const [targets, setTargets] = useState<TargetEntity[]>(DEFAULT_DEMO_TARGETS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTargets = useCallback(async () => {
    try {
      const data = await api.listTargets();
      if (data && data.length > 0) {
        setTargets(data);
      } else {
        setTargets(DEFAULT_DEMO_TARGETS);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load targets from backend");
      // Fall back to default demo targets
      setTargets(DEFAULT_DEMO_TARGETS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTarget = async (data: { name: string; url: string; is_demo?: boolean }) => {
    try {
      const res = await api.createTarget(data);
      await fetchTargets();
      return res.target;
    } catch (err) {
      // Local fallback creation
      const newTarget: TargetEntity = {
        id: `target-${Date.now()}`,
        name: data.name,
        url: data.url,
        domain: new URL(data.url).hostname || data.url,
        status: "READY",
        health: 1.0,
        is_demo: !!data.is_demo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTargets((prev) => [newTarget, ...prev]);
      return newTarget;
    }
  };

  const deleteTarget = async (id: string) => {
    try {
      await api.deleteTarget(id);
    } catch {
      // ignore
    }
    setTargets((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  return {
    targets,
    isLoading,
    error,
    refresh: fetchTargets,
    createTarget,
    deleteTarget,
  };
}
