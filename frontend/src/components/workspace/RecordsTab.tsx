import React, { useState } from "react";
import { Download, Search, FileJson, Copy, Check, Table as TableIcon } from "lucide-react";
import { HarvestRecord, ExtractionSchema } from "../../lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { EmptyState } from "../ui/EmptyState";
import { MissingFieldTag } from "../ui/MissingFieldTag";

interface RecordsTabProps {
  records: HarvestRecord[];
  schema: ExtractionSchema | null;
  onTriggerRun: () => void;
  isRunning?: boolean;
}

export function RecordsTab({ records, schema, onTriggerRun, isRunning = false }: RecordsTabProps) {
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<HarvestRecord | null>(records[0] || null);
  const [copied, setCopied] = useState(false);

  // Extract columns from schema or infer from records
  const columns =
    schema?.fields && schema.fields.length > 0
      ? schema.fields.map((f) => f.name)
      : records.length > 0
      ? Object.keys(records[0].data || {})
      : ["id", "title", "severity", "author", "date"];

  const filteredRecords = records.filter((r) => {
    if (!search) return true;
    const str = JSON.stringify(r.data).toLowerCase();
    return str.includes(search.toLowerCase());
  });

  const exportCSV = () => {
    if (records.length === 0) return;
    const headers = columns.join(",");
    const rows = records.map((r) =>
      columns.map((c) => `"${(r.data[c] ?? "").toString().replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sentinel_records_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyJSON = () => {
    if (!selectedRecord) return;
    navigator.clipboard.writeText(JSON.stringify(selectedRecord.data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-1)]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search harvested records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={records.length === 0}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onTriggerRun}
            disabled={isRunning}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>{isRunning ? "Harvesting..." : "Run Scraper"}</span>
          </Button>
        </div>
      </div>

      {/* Grid or Empty State */}
      {records.length === 0 ? (
        <EmptyState
          icon={<TableIcon className="w-6 h-6 text-[var(--accent)]" />}
          title="No extracted records yet"
          description="Trigger a scraper run to harvest structured records from the target website. All fields are parsed according to your active schema."
          actionLabel="Run Scraper Now"
          onAction={onTriggerRun}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Table (2 cols) */}
          <div className="lg:col-span-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-1)] overflow-hidden flex flex-col">
            <div className="p-3.5 border-b border-[var(--border-default)] bg-[var(--bg-secondary)] flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono">
              <span>Showing {filteredRecords.length} records</span>
              <span>100% Unfabricated Payload Data</span>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border-strong)] z-10">
                  <tr>
                    <th className="p-3 font-mono font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      #
                    </th>
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="p-3 font-mono font-medium text-[var(--text-secondary)] uppercase tracking-wider truncate max-w-[160px]"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {filteredRecords.map((record, index) => {
                    const isSelected = selectedRecord?.id === record.id;
                    return (
                      <tr
                        key={record.id || index}
                        onClick={() => setSelectedRecord(record)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[var(--selection-fill)] font-medium"
                            : "hover:bg-[var(--surface-sunken)]"
                        }`}
                      >
                        <td className="p-3 font-mono text-[var(--text-tertiary)] w-10">
                          {index + 1}
                        </td>
                        {columns.map((col) => {
                          const val = record.data?.[col];
                          return (
                            <td key={col} className="p-3 truncate max-w-[200px] text-[var(--text-primary)]">
                              {val !== undefined && val !== null && val !== "" ? (
                                String(val)
                              ) : (
                                <MissingFieldTag />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* JSON Inspector (1 col) */}
          <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-1)] flex flex-col">
            <div className="p-3.5 border-b border-[var(--border-default)] bg-[var(--bg-secondary)] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <FileJson className="w-4 h-4 text-[var(--accent)]" />
                <span>JSON Record Inspector</span>
              </div>

              {selectedRecord && (
                <button
                  onClick={copyJSON}
                  className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline font-mono"
                  title="Copy raw JSON"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              )}
            </div>

            <div className="p-4 flex-1 overflow-auto max-h-[460px] bg-[var(--code-surface)] font-mono text-xs text-[var(--text-primary)]">
              {selectedRecord ? (
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(selectedRecord.data, null, 2)}
                </pre>
              ) : (
                <div className="h-40 flex items-center justify-center text-xs text-[var(--text-tertiary)] italic">
                  Select a record to inspect raw payload
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
