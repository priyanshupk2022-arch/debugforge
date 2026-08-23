import React, { useState } from "react";
import { ArrowLeft, Play, ShieldAlert, Search, RefreshCw, Globe, ArrowUpRight } from "lucide-react";
import { useTarget } from "../../hooks/useTarget";
import { api } from "../../lib/api";
import { WorkspaceTabs, WorkspaceTabKey } from "./WorkspaceTabs";
import { OverviewTab } from "./OverviewTab";
import { RecordsTab } from "./RecordsTab";
import { EvidenceHealingTab } from "../evidence/EvidenceHealingTab";
import { ExposureTab } from "./ExposureTab";
import { SchemaTab } from "./SchemaTab";
import { SettingsTab } from "./SettingsTab";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface TargetWorkspaceProps {
  targetId: string;
  onBackToIndex: () => void;
  onOpenNewTargetDrawer: () => void;
  onTargetDeleted: () => void;
}

export function TargetWorkspace({
  targetId,
  onBackToIndex,
  onOpenNewTargetDrawer,
  onTargetDeleted,
}: TargetWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTabKey>("overview");
  const {
    target,
    inspection,
    schema,
    records,
    latestRun,
    isLoading,
    isInspecting,
    isGeneratingSchema,
    isRunning,
    error,
    refresh,
    inspect,
    generateSchema,
    saveSchema,
    triggerRun,
  } = useTarget(targetId);

  if (isLoading && !target) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-48" />
        </div>
        <Skeleton className="h-64 w-full rounded-[var(--radius-md)]" />
      </main>
    );
  }

  if (!target) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
          Target Not Found
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          The requested target entity does not exist in SQLite storage.
        </p>
        <Button variant="primary" onClick={onBackToIndex}>
          Return to Registry Home
        </Button>
      </main>
    );
  }

  const handleSimulateChaos = async () => {
    return await api.mutateChaos(1.0);
  };

  const handleDelete = async () => {
    await api.deleteTarget(target.id);
    onTargetDeleted();
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Sub-Header / Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToIndex}
            className="text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Registry</span>
          </Button>

          <div className="h-4 w-[1px] bg-[var(--border-default)]" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-semibold text-lg text-[var(--text-primary)] leading-tight">
                {target.name}
              </h1>
              {target.is_demo && (
                <Badge variant="simulated" className="text-[10px]">
                  Simulation
                </Badge>
              )}
            </div>
            <div className="text-xs text-[var(--text-tertiary)] font-mono truncate max-w-sm">
              {target.url}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            title="Refresh Target State"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={triggerRun}
            disabled={isRunning}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isRunning ? "Running Scraper..." : "Execute Scraper"}</span>
          </Button>
        </div>
      </div>

      {/* Persistent Workspace Tabs */}
      <WorkspaceTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        recordCount={records.length}
        hasBrokenOrHealed={latestRun?.status === "HEALED"}
      />

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === "overview" && (
          <OverviewTab
            target={target}
            inspection={inspection}
            schema={schema}
            records={records}
            onTriggerRun={triggerRun}
            onSimulateChaos={handleSimulateChaos}
            onInspect={inspect}
            onSelectTab={(t) => setActiveTab(t as WorkspaceTabKey)}
            isRunning={isRunning}
          />
        )}

        {activeTab === "records" && (
          <RecordsTab
            records={records}
            schema={schema}
            onTriggerRun={triggerRun}
            isRunning={isRunning}
          />
        )}

        {activeTab === "evidence" && (
          <EvidenceHealingTab
            target={target}
            latestRun={latestRun}
            onTriggerRun={triggerRun}
            onSimulateChaos={handleSimulateChaos}
            isRunning={isRunning}
          />
        )}

        {activeTab === "exposure" && (
          <ExposureTab />
        )}

        {activeTab === "schema" && (
          <SchemaTab
            schema={schema}
            onSaveSchema={saveSchema}
            onGenerateSchema={generateSchema}
            isGenerating={isGeneratingSchema}
          />
        )}

        {activeTab === "settings" && (
          <SettingsTab
            target={target}
            onDeleteTarget={handleDelete}
            onSimulateChaos={handleSimulateChaos}
          />
        )}
      </div>
    </main>
  );
}
