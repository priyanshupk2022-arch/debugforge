import React, { useState, useEffect } from "react";
import { Plus, Trash2, Sparkles, Save, Check, Loader2 } from "lucide-react";
import { ExtractionSchema, ExtractionField } from "../../lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";

interface SchemaTabProps {
  schema: ExtractionSchema | null;
  onSaveSchema: (fields: ExtractionField[], name?: string) => Promise<any>;
  onGenerateSchema: (intent: string) => Promise<any>;
  isGenerating?: boolean;
}

export function SchemaTab({
  schema,
  onSaveSchema,
  onGenerateSchema,
  isGenerating = false,
}: SchemaTabProps) {
  const [fields, setFields] = useState<ExtractionField[]>([]);
  const [intent, setIntent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (schema?.fields) {
      setFields(schema.fields);
    }
    if (schema?.intent_prompt) {
      setIntent(schema.intent_prompt);
    }
  }, [schema]);

  const handleAddField = () => {
    setFields((prev) => [
      ...prev,
      {
        name: `field_${prev.length + 1}`,
        selector: "",
        field_type: "text",
        required: false,
      },
    ]);
  };

  const handleRemoveField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, key: keyof ExtractionField, value: any) => {
    setFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveSchema(fields, schema?.name);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!intent) return;
    await onGenerateSchema(intent);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Gemini Intent Generator Box */}
      <div className="p-6 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-1)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-base text-[var(--text-primary)]">
              AI Schema Generation (Gemini 3.7 Flash)
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Describe your extraction intent in plain English to automatically derive robust CSS selectors.
            </p>
          </div>
          <span className="font-mono text-xs text-[var(--information)] bg-[var(--surface-sunken)] px-2.5 py-1 rounded-[var(--radius-xs)] border border-[var(--border-default)]">
            Schema v{schema?.version || 1}
          </span>
        </div>

        <div className="space-y-2">
          <Textarea
            placeholder="e.g. Extract vulnerability CVE code, title, severity ranking, author name, and date posted from tables"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            rows={2}
          />

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating || !intent}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Schema...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Regenerate Schema</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Field Editor Table */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-1)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border-default)] bg-[var(--bg-secondary)] flex items-center justify-between">
          <div className="text-xs font-semibold font-mono text-[var(--text-primary)] uppercase tracking-wider">
            Typed Field Definitions ({fields.length})
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleAddField}>
              <Plus className="w-3.5 h-3.5" />
              <span>Add Field</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : savedSuccess ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{savedSuccess ? "Saved!" : "Save Schema"}</span>
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {fields.map((field, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-[var(--radius-xs)] bg-[var(--surface-sunken)] border border-[var(--border-default)] grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
            >
              <div className="md:col-span-3">
                <label className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase block mb-1">
                  Field Name
                </label>
                <Input
                  value={field.name}
                  onChange={(e) => handleFieldChange(idx, "name", e.target.value)}
                  className="bg-[var(--bg-elevated)] h-8 text-xs font-mono"
                  placeholder="field_name"
                />
              </div>

              <div className="md:col-span-5">
                <label className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase block mb-1">
                  CSS Selector
                </label>
                <Input
                  value={field.selector}
                  onChange={(e) => handleFieldChange(idx, "selector", e.target.value)}
                  className="bg-[var(--bg-elevated)] h-8 text-xs font-mono"
                  placeholder="e.g. td.title a"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase block mb-1">
                  Type
                </label>
                <select
                  value={field.field_type}
                  onChange={(e) => handleFieldChange(idx, "field_type", e.target.value)}
                  className="w-full h-8 px-2 rounded-[var(--radius-xs)] border border-[var(--border-default)] bg-[var(--bg-elevated)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="text">text</option>
                  <option value="number">number</option>
                  <option value="url">url</option>
                  <option value="date">date</option>
                </select>
              </div>

              <div className="md:col-span-1 flex flex-col items-center">
                <label className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase block mb-1">
                  Req
                </label>
                <Switch
                  checked={field.required}
                  onCheckedChange={(checked) => handleFieldChange(idx, "required", checked)}
                />
              </div>

              <div className="md:col-span-1 flex justify-end">
                <button
                  onClick={() => handleRemoveField(idx)}
                  className="p-1.5 rounded-[var(--radius-xs)] text-[var(--broken)] hover:bg-[var(--broken-tint)] transition-colors"
                  title="Remove field"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
