import React, { useState, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search, Target, Play, ShieldAlert, Plus, Layers, ArrowRight } from "lucide-react";
import { TargetEntity } from "../../lib/api";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: TargetEntity[];
  activeTargetId: string | null;
  onSelectTarget: (id: string) => void;
  onSelectTab: (tabKey: string) => void;
  onTriggerRun: () => void;
  onSimulateChaos: () => void;
  onOpenNewTarget: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  targets,
  activeTargetId,
  onSelectTarget,
  onSelectTab,
  onTriggerRun,
  onSimulateChaos,
  onOpenNewTarget,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const actions = [
    {
      id: "action-run",
      title: "Trigger Scraper Run",
      category: "Actions",
      icon: <Play className="w-4 h-4 text-[var(--accent)]" />,
      perform: () => onTriggerRun(),
    },
    {
      id: "action-chaos",
      title: "Simulate Chaos Mutation",
      category: "Actions",
      icon: <ShieldAlert className="w-4 h-4 text-[var(--broken)]" />,
      perform: () => onSimulateChaos(),
    },
    {
      id: "action-new-target",
      title: "Onboard New Target",
      category: "Actions",
      icon: <Plus className="w-4 h-4 text-[var(--accent)]" />,
      perform: () => onOpenNewTarget(),
    },
    {
      id: "tab-overview",
      title: "Jump to Overview",
      category: "Navigation",
      icon: <Layers className="w-4 h-4 text-[var(--text-secondary)]" />,
      perform: () => onSelectTab("overview"),
    },
    {
      id: "tab-records",
      title: "Jump to Runs & Records",
      category: "Navigation",
      icon: <Layers className="w-4 h-4 text-[var(--text-secondary)]" />,
      perform: () => onSelectTab("records"),
    },
    {
      id: "tab-evidence",
      title: "Jump to Evidence & Self-Healing",
      category: "Navigation",
      icon: <Layers className="w-4 h-4 text-[var(--verified)]" />,
      perform: () => onSelectTab("evidence"),
    },
    {
      id: "tab-schema",
      title: "Jump to Schema Editor",
      category: "Navigation",
      icon: <Layers className="w-4 h-4 text-[var(--text-secondary)]" />,
      perform: () => onSelectTab("schema"),
    },
    {
      id: "tab-settings",
      title: "Jump to Settings",
      category: "Navigation",
      icon: <Layers className="w-4 h-4 text-[var(--text-secondary)]" />,
      perform: () => onSelectTab("settings"),
    },
  ];

  const filteredTargets = targets.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.url.toLowerCase().includes(query.toLowerCase())
  );

  const filteredActions = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[20%] z-50 w-full max-w-xl translate-x-[-50%] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-0 shadow-[var(--shadow-3)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center border-b border-[var(--border-default)] px-4 py-3">
            <Search className="w-4 h-4 text-[var(--text-tertiary)] shrink-0 mr-3" />
            <input
              type="text"
              placeholder="Type a command or search targets..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-[var(--surface-sunken)] border border-[var(--border-default)] font-mono text-[10px] text-[var(--text-tertiary)]">
              ESC
            </kbd>
          </div>

          <div className="max-h-80 overflow-y-auto p-2 space-y-4">
            {filteredActions.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                  Actions & Navigation
                </div>
                <div className="space-y-0.5">
                  {filteredActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        action.perform();
                        onOpenChange(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-[var(--radius-xs)] text-sm text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {action.icon}
                        <span>{action.title}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredTargets.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                  Targets
                </div>
                <div className="space-y-0.5">
                  {filteredTargets.map((target) => (
                    <button
                      key={target.id}
                      onClick={() => {
                        onSelectTarget(target.id);
                        onOpenChange(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-[var(--radius-xs)] text-sm text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] text-left transition-colors"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Target className="w-4 h-4 text-[var(--accent)] shrink-0" />
                        <span className="truncate">{target.name}</span>
                        {target.is_demo && (
                          <span className="px-1.5 py-0.2 rounded-[var(--radius-xs)] bg-[var(--simulated-tint)] text-[var(--simulated)] border border-[var(--simulated-border)] text-[10px] font-mono uppercase">
                            Demo
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[var(--text-tertiary)] font-mono shrink-0 ml-2">
                        {target.domain}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredActions.length === 0 && filteredTargets.length === 0 && (
              <div className="p-8 text-center text-sm text-[var(--text-tertiary)]">
                No matching actions or targets
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
