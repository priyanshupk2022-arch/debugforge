import React, { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Globe, Search, Sparkles, Play, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { api, TargetEntity, InspectionResult, ExtractionSchema, ExtractionField } from "../../lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";

interface OnboardingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTargetCreated: (targetId: string) => void;
}

export function OnboardingDrawer({
  open,
  onOpenChange,
  onTargetCreated,
}: OnboardingDrawerProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [intentPrompt, setIntentPrompt] = useState("");

  // Server Entities
  const [createdTarget, setCreatedTarget] = useState<TargetEntity | null>(null);
  const [inspection, setInspection] = useState<InspectionResult | null>(null);
  const [schema, setSchema] = useState<ExtractionSchema | null>(null);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setStep(1);
    setName("");
    setUrl("");
    setIsDemo(false);
    setIntentPrompt("");
    setCreatedTarget(null);
    setInspection(null);
    setSchema(null);
    setError(null);
    setIsLoading(false);
  };

  // Step 1: Create Target
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.createTarget({ name, url, is_demo: isDemo });
      setCreatedTarget(res.target);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to create target");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Run Playwright Inspection
  const handleInspect = async () => {
    if (!createdTarget) return;
    setIsLoading(true);
    setError(null);
    try {
      const insp = await api.inspectTarget(createdTarget.id);
      setInspection(insp);
      setStep(3);
    } catch (err: any) {
      setError(err.message || "DOM inspection failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Generate Schema with Gemini
  const handleGenerateSchema = async () => {
    if (!createdTarget || !intentPrompt) return;
    setIsLoading(true);
    setError(null);
    try {
      const genSchema = await api.generateSchema(createdTarget.id, intentPrompt);
      setSchema(genSchema);
      setStep(4);
    } catch (err: any) {
      setError(err.message || "Schema generation failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4: Bind Scraper & Launch
  const handleBindAndLaunch = async () => {
    if (!createdTarget) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.bindScraper(createdTarget.id, {
        name: `${createdTarget.name} Scraper`,
        instructions: intentPrompt,
      });

      onOpenChange(false);
      onTargetCreated(createdTarget.id);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to bind and launch scraper");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { num: 1, label: "Register Target", icon: Globe },
    { num: 2, label: "DOM Inspect", icon: Search },
    { num: 3, label: "AI Schema", icon: Sparkles },
    { num: 4, label: "Bind & Run", icon: Play },
  ];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-md md:max-w-lg border-l border-[var(--border-default)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-3)] flex flex-col justify-between overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-200">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-default)] mb-6">
              <div>
                <DialogPrimitive.Title className="font-display font-semibold text-lg text-[var(--text-primary)]">
                  Onboard Website Target
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Walk through registration, deep DOM inspection, and AI schema generation.
                </DialogPrimitive.Description>
              </div>

              <DialogPrimitive.Close className="p-1.5 rounded-[var(--radius-xs)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors">
                <X className="w-4 h-4" />
              </DialogPrimitive.Close>
            </div>

            {/* Step Rail */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {steps.map((s) => {
                const Icon = s.icon;
                const isCurrent = step === s.num;
                const isPassed = step > s.num;
                return (
                  <div
                    key={s.num}
                    className={`flex flex-col items-center p-2 rounded-[var(--radius-xs)] text-center transition-colors ${
                      isCurrent
                        ? "bg-[var(--selection-fill)] border border-[var(--accent)] text-[var(--accent)]"
                        : isPassed
                        ? "bg-[var(--surface-sunken)] text-[var(--verified)]"
                        : "bg-[var(--bg-primary)] text-[var(--text-tertiary)] opacity-60"
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 mb-1" />
                    ) : (
                      <Icon className="w-4 h-4 mb-1" />
                    )}
                    <span className="text-[10px] font-mono uppercase truncate max-w-full font-medium">
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3 mb-4 rounded-[var(--radius-xs)] bg-[var(--broken-tint)] border border-[var(--broken-border)] text-xs text-[var(--broken)] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Registration */}
            {step === 1 && (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] uppercase tracking-wider mb-1.5 font-mono">
                    Target Name
                  </label>
                  <Input
                    placeholder="e.g. Exploit-DB Advisory Portal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] uppercase tracking-wider mb-1.5 font-mono">
                    Target URL (with SSRF Guard)
                  </label>
                  <Input
                    type="url"
                    placeholder="https://example.com/advisories"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-primary)] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-[var(--text-primary)]">
                      Simulated Chaos Target
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      Enable for demo targets routed through the local chaos proxy.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isDemo}
                    onChange={(e) => setIsDemo(e.target.checked)}
                    className="h-4 w-4 rounded accent-[var(--accent)]"
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={isLoading || !name || !url}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Validating URL...</span>
                      </>
                    ) : (
                      <span>Proceed to DOM Inspection</span>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 2: DOM Inspect */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="p-4 rounded-[var(--radius-sm)] bg-[var(--bg-primary)] border border-[var(--border-default)] space-y-2">
                  <div className="text-xs text-[var(--text-secondary)]">Target Registered:</div>
                  <div className="font-semibold text-sm text-[var(--text-primary)]">
                    {createdTarget?.name}
                  </div>
                  <div className="font-mono text-xs text-[var(--text-tertiary)] truncate">
                    {createdTarget?.url}
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Sentinel-Chain will launch headless Playwright to inspect the DOM tree, analyze semantic elements, and extract candidate field selectors.
                </p>

                <Button
                  onClick={handleInspect}
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Inspecting DOM Structure...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Start Playwright Inspection</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* STEP 3: Schema Generation with Gemini */}
            {step === 3 && (
              <div className="space-y-4">
                {inspection && (
                  <div className="p-3 rounded-[var(--radius-xs)] bg-[var(--surface-sunken)] border border-[var(--border-default)] space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase">Page Title</span>
                      <Badge variant="information">{inspection.page_type || "Catalog"}</Badge>
                    </div>
                    <div className="font-medium text-[var(--text-primary)] truncate">
                      {inspection.title || createdTarget?.domain}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] uppercase tracking-wider mb-1.5 font-mono">
                    Extraction Intent Prompt (Gemini AI)
                  </label>
                  <Textarea
                    placeholder="e.g. Extract CVE vulnerability id, title, severity score, author, and publish date from table rows"
                    value={intentPrompt}
                    onChange={(e) => setIntentPrompt(e.target.value)}
                    rows={3}
                  />
                  <div className="text-[11px] text-[var(--text-tertiary)] mt-1">
                    Describe the data entities you wish to harvest in plain English.
                  </div>
                </div>

                <Button
                  onClick={handleGenerateSchema}
                  variant="primary"
                  className="w-full"
                  disabled={isLoading || !intentPrompt}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Schema with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Typed Schema</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* STEP 4: Review Schema & Bind */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[var(--text-primary)] uppercase tracking-wider font-mono">
                    Generated Schema ({schema?.fields.length || 0} fields)
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-[var(--border-default)] rounded-[var(--radius-sm)] p-2 bg-[var(--bg-primary)]">
                    {schema?.fields.map((f, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-[var(--radius-xs)] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-medium text-[var(--text-primary)]">{f.name}</span>
                          <span className="font-mono text-[10px] text-[var(--text-tertiary)] ml-2">
                            ({f.field_type})
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-[var(--text-secondary)] truncate max-w-[150px]">
                          {f.selector}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleBindAndLaunch}
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Binding Scraper & Launching...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Bind Scraper & Open Workspace</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[var(--border-default)] flex items-center justify-between text-xs text-[var(--text-tertiary)] font-mono">
            <span>Step {step} of 4</span>
            <span>Sentinel-Chain v2.0</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
