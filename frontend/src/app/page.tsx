"use client";

import React, { useState, useEffect } from "react";
import { useTargets } from "../hooks/useTargets";
import { TopBar } from "../components/navigation/TopBar";
import { TargetsIndex } from "../components/targets/TargetsIndex";
import { TargetWorkspace } from "../components/workspace/TargetWorkspace";
import { OnboardingDrawer } from "../components/onboarding/OnboardingDrawer";
import { AnimatedGridBackground } from "../components/ui/AnimatedGridBackground";

export default function Home() {
  const { targets, isLoading, refresh } = useTargets();
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Auto-select demo target or first target if available on initial load
  useEffect(() => {
    if (!activeTargetId && targets.length > 0) {
      const demo = targets.find((t) => t.is_demo);
      if (demo) {
        setActiveTargetId(demo.id);
      }
    }
  }, [targets, activeTargetId]);

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col relative overflow-x-hidden">
      {/* Ambient Animated Cyber Mesh Background */}
      <AnimatedGridBackground />

      {/* Global TopBar Navigation Shell */}
      <TopBar
        targets={targets}
        activeTargetId={activeTargetId}
        onSelectTarget={(id) => setActiveTargetId(id)}
        onOpenNewTargetDrawer={() => setDrawerOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 relative z-10">
        {activeTargetId ? (
          <TargetWorkspace
            targetId={activeTargetId}
            onBackToIndex={() => setActiveTargetId(null)}
            onOpenNewTargetDrawer={() => setDrawerOpen(true)}
            onTargetDeleted={() => {
              setActiveTargetId(null);
              refresh();
            }}
          />
        ) : (
          <TargetsIndex
            targets={targets}
            isLoading={isLoading}
            onSelectTarget={(id) => setActiveTargetId(id)}
            onOpenNewTargetDrawer={() => setDrawerOpen(true)}
            onRefresh={refresh}
          />
        )}
      </div>

      {/* Slide-out Onboarding Drawer */}
      <OnboardingDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onTargetCreated={(newId) => {
          refresh();
          setActiveTargetId(newId);
        }}
      />
    </div>
  );
}
