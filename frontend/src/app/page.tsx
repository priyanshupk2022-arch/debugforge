"use client";

import { Plus, Zap, BarChart2, Search, Loader2, AlertCircle, ChevronRight, Wifi, WifiOff, Shield, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { TargetCard } from "@/components/TargetCard";

interface Target {
  id: string;
  name: string;
  url: string;
  domain: string;
  status: string;
  health: number;
  is_demo: boolean;
  last_run?: string;
  monitoring_enabled: boolean;
  schedule: string;
}

interface EmptyStateProps {
  onCreateDemo: () => void;
}

function EmptyState({ onCreateDemo }: EmptyStateProps) {
  return (
    <div className="col-span-12 animate-fade-in">
      <article className="card p-8 lg:p-12 text-center max-w-3xl mx-auto">
        <div className="w-16 h-16 rounded-lg bg-surface-sunken flex items-center justify-center mx-auto mb-6">
          <Zap className="w-8 h-8 text-accent" />
        </div>
        <h2 className="font-display text-display-sm text-ink mb-3">
          No targets yet
        </h2>
        <p className="text-body-lg text-ink-muted mb-8 max-w-lg mx-auto">
          Sentinel-Chain extracts structured data from any website and keeps it flowing
          even when the site changes. Start by adding a target — try the guided demo
          to see the self-healing loop in action.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onCreateDemo}
            className="btn btn-primary btn-lg w-full sm:w-auto"
          >
            <Zap className="w-5 h-5" />
            Try the Demo Target
          </button>
          <button className="btn btn-secondary btn-lg w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            Add Your Own Target
          </button>
        </div>
        <div className="mt-8 pt-8 border-t border-line">
          <p className="text-body-sm text-ink-muted">
            The demo target runs against a live chaos proxy that simulates DOM mutations.
            Watch the <span className="font-mono-data text-accent">Evidence & Healing</span> tab
            for the real signal path: Run → Broken → Evidence → Diagnosis → Proposal → Gate → Heal → Verified.
          </p>
        </div>
      </article>
    </div>
  );
}

function TargetsGrid({ targets, onRun, onOpen, onDelete }: {
  targets: Target[];
  onRun: (id: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const demoTarget = targets.find(t => t.is_demo);
  const otherTargets = targets.filter(t => !t.is_demo);

  return (
    <div className="grid-bento animate-fade-in">
      {demoTarget && (
        <TargetCard
          target={demoTarget}
          onRun={onRun}
          onOpen={onOpen}
          onDelete={onDelete}
          isPrimary={true}
        />
      )}
      {otherTargets.map((target, i) => (
        <TargetCard
          key={target.id}
          target={target}
          onRun={onRun}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      ))}
      {targets.length === 0 && <EmptyState onCreateDemo={() => {}} />}
    </div>
  );
}

export default function TargetsIndex() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const res = await fetch("/api/targets");
        if (!res.ok) throw new Error("Failed to load targets");
        const data = await res.json();
        setTargets(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchTargets();
  }, []);

  const handleRun = (id: string) => {
    const target = targets.find(t => t.id === id);
    if (!target) return;
    window.location.href = `/targets/${id}?run=true`;
  };

  const handleOpen = (id: string) => {
    window.location.href = `/targets/${id}`;
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this target? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/targets/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTargets(prev => prev.filter(t => t.id !== id));
      }
    } catch (e) {
      alert("Failed to delete target");
    }
  };

  const handleCreateDemo = async () => {
    try {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Demo: Shopalto Product (Self-Healing)",
          url: "https://shopalto.xyz/product/aurora-wireless-headphones",
          is_demo: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = `/targets/${data.target.id}?run=true`;
      }
    } catch (e) {
      alert("Failed to create demo target");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <TopBar onAddTarget={handleCreateDemo} onCommandPalette={() => {}} />
        <main className="container-workspace py-8">
          <div className="grid-bento">
            {[1, 2, 3].map(i => (
              <article key={i} className="card col-span-12 lg:col-span-4 animate-pulse-subtle">
                <div className="p-4 space-y-4">
                  <div className="h-6 bg-surface-sunken rounded w-3/4 animate-pulse-subtle" />
                  <div className="h-4 bg-surface-sunken rounded w-1/2 animate-pulse-subtle" />
                  <div className="h-4 bg-surface-sunken rounded w-full animate-pulse-subtle" />
                  <div className="h-4 bg-surface-sunken rounded w-2/3 animate-pulse-subtle" />
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <TopBar
        onAddTarget={handleCreateDemo}
        onCommandPalette={() => {}}
      />
      <main className="container-workspace py-8">
        {/* Page header */}
        <header className="mb-8">
          <h1 className="font-display text-display-md text-brand-ink mb-2">
            Targets
          </h1>
          <p className="text-body text-ink-muted">
            {targets.length} target{targets.length !== 1 ? "s" : ""} •{" "}
            <span className="font-mono-data text-accent">
              {targets.filter(t => t.status === "HEALTHY").length} healthy
            </span>
            {" • "}
            <span className="font-mono-data text-degraded">
              {targets.filter(t => t.status === "DEGRADED").length} degraded
            </span>
            {" • "}
            <span className="font-mono-data text-broken">
              {targets.filter(t => t.status === "FAILED").length} failed
            </span>
          </p>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-md bg-broken/10 border border-broken/20 text-broken flex items-center justify-between animate-fade-in">
            <span>Failed to load targets: {error}</span>
            <button onClick={() => window.location.reload()} className="btn btn-ghost btn-sm text-broken">
              Retry
            </button>
          </div>
        )}

        <TargetsGrid
          targets={targets}
          onRun={handleRun}
          onOpen={handleOpen}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}