import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus, Globe } from "lucide-react";
import { TargetEntity } from "../../lib/api";

interface TargetSwitcherProps {
  targets: TargetEntity[];
  activeTargetId: string | null;
  onSelectTarget: (targetId: string) => void;
  onOpenNewTargetDrawer: () => void;
}

export function TargetSwitcher({
  targets,
  activeTargetId,
  onSelectTarget,
  onOpenNewTargetDrawer,
}: TargetSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTarget = targets.find((t) => t.id === activeTargetId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = targets.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border-strong)] shadow-[var(--shadow-1)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="w-2 h-2 rounded-full bg-[var(--verified)] shrink-0" />
        <span className="max-w-[180px] truncate text-left">
          {activeTarget ? activeTarget.name : "Select Target"}
        </span>
        {activeTarget?.is_demo && (
          <span className="px-1.5 py-0.2 rounded-[var(--radius-xs)] bg-[var(--simulated-tint)] text-[var(--simulated)] border border-[var(--simulated-border)] text-[10px] uppercase font-mono">
            Demo
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-72 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-3)] z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="p-1 mb-1">
            <input
              type="text"
              placeholder="Search targets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 px-2.5 rounded-[var(--radius-xs)] border border-[var(--border-default)] bg-[var(--bg-primary)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]"
              autoFocus
            />
          </div>

          <div className="max-h-56 overflow-y-auto py-1 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[var(--text-tertiary)] text-center">
                No targets found
              </div>
            ) : (
              filtered.map((target) => (
                <button
                  key={target.id}
                  onClick={() => {
                    onSelectTarget(target.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[var(--radius-xs)] text-left text-xs transition-colors ${
                    target.id === activeTargetId
                      ? "bg-[var(--selection-fill)] text-[var(--text-primary)] font-medium"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Globe className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
                    <div className="truncate">
                      <div className="truncate font-medium">{target.name}</div>
                      <div className="truncate text-[10px] text-[var(--text-tertiary)] font-mono">
                        {target.domain}
                      </div>
                    </div>
                  </div>
                  {target.id === activeTargetId && (
                    <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 ml-2" />
                  )}
                </button>
              ))
            )}
          </div>

          <div className="pt-1 mt-1 border-t border-[var(--border-default)]">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenNewTargetDrawer();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-xs)] text-xs font-medium text-[var(--accent)] hover:bg-[var(--surface-sunken)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Onboard New Target...</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
