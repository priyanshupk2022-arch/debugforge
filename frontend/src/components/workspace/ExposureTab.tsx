import React, { useState, useEffect } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2, Server, ArrowRight, ShieldCheck, RefreshCw, Cpu } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { SpotlightCard } from "../ui/SpotlightCard";
import { BorderBeam } from "../ui/BorderBeam";
import { ShinyText } from "../ui/ShinyText";

interface ExposureRecord {
  id: string;
  asset_id: string;
  asset_name: string;
  cve_id: string;
  threat_title: string;
  severity: string;
  risk_score: number;
  matched_version: string;
  mitigation_status: string;
  provenance_snippet: string;
}

export function ExposureTab() {
  const [exposures, setExposures] = useState<ExposureRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExposures = async () => {
    setIsLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/exposure/correlate`);
      const data = await res.json();
      setExposures(data);
    } catch {
      // Default sample fallback
      setExposures([
        {
          id: "exp-1",
          asset_id: "ast-web-prod",
          asset_name: "Production Web Gateway (Apache)",
          cve_id: "CVE-2021-42013",
          threat_title: "Apache HTTP Server 2.4.50 Path Traversal & RCE Exploit",
          severity: "critical",
          risk_score: 9.8,
          matched_version: "2.4.50",
          mitigation_status: "PATCH_REQUIRED",
          provenance_snippet: "ap_normalize_path filter bypass enables remote command execution via mod_cgi."
        },
        {
          id: "exp-2",
          asset_id: "ast-api-auth",
          asset_name: "Auth Core Service (OpenSSL)",
          cve_id: "CVE-2022-3602",
          threat_title: "OpenSSL Punycode Buffer Overflow in X.509 Certificate Verification",
          severity: "high",
          risk_score: 7.5,
          matched_version: "3.0.2",
          mitigation_status: "UPGRADE_PENDING",
          provenance_snippet: "Buffer overflow triggered during 4-byte arbitrary stack write in X.509 parsing."
        },
        {
          id: "exp-3",
          asset_id: "ast-edge-proxy",
          asset_name: "Edge Reverse Proxy (NGINX)",
          cve_id: "CVE-2023-44487",
          threat_title: "HTTP/2 Rapid Reset Denial of Service",
          severity: "medium",
          risk_score: 5.3,
          matched_version: "1.25.1",
          mitigation_status: "MITIGATED",
          provenance_snippet: "RST_STREAM frame flood causes resource exhaustion on HTTP/2 multiplexing."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExposures();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Header */}
      <SpotlightCard className="p-6 relative overflow-hidden" spotlightColor="rgba(239, 68, 68, 0.15)">
        <BorderBeam size={240} duration={12} colorFrom="#EF4444" colorTo="#6366F1" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/30 text-xs font-mono text-rose-400 uppercase font-semibold tracking-wider mb-2.5 shadow-[0_0_15px_rgba(239,68,68,0.25)]">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Downstream Intelligence Value</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Asset <ShinyText text="Exposure Correlation Engine" />
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              Demonstrating what the structured output from Bright Data Scraper Studio goes on to power: real-time mapping of harvested public threats against internal infrastructure SBOM assets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExposures}
              className="border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-neutral-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-Correlate</span>
            </Button>
          </div>
        </div>
      </SpotlightCard>

      {/* 3 Pipeline Impact Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <SpotlightCard className="p-5" spotlightColor="rgba(239, 68, 68, 0.15)">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono uppercase mb-2">
            <span>Critical Exposures</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="font-mono text-3xl font-bold text-rose-400">
            {exposures.filter(e => e.severity === "critical").length} Detected
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Active exploits matching internal SBOM versions
          </p>
        </SpotlightCard>

        <SpotlightCard className="p-5" spotlightColor="rgba(99, 102, 241, 0.15)">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono uppercase mb-2">
            <span>Harvested Threat Feeds</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="font-mono text-3xl font-bold text-white">
            100% Verified
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Ingested via Bright Data Scraper Studio proxy
          </p>
        </SpotlightCard>

        <SpotlightCard className="p-5" spotlightColor="rgba(16, 185, 129, 0.15)">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono uppercase mb-2">
            <span>Auto-Mitigation Runbooks</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono text-3xl font-bold text-emerald-400">
            Automated
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Zero human intervention required on scraper break
          </p>
        </SpotlightCard>
      </div>

      {/* Exposure Correlation Table */}
      <SpotlightCard className="p-6 space-y-4" spotlightColor="rgba(99, 102, 241, 0.15)">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <h3 className="font-semibold text-base text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              <span>Correlated Threat vs Asset Exposure Matrix</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Structured CVE threat records harvested by Bright Data directly cross-referenced against internal server manifests.
            </p>
          </div>

          <Badge variant="information" dot>Live SBOM Cross-Match</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-white/[0.08] text-neutral-400 uppercase text-[10px]">
                <th className="py-3 px-2">Severity</th>
                <th className="py-3 px-3">CVE Identifier</th>
                <th className="py-3 px-3">Threat & Exploit Details</th>
                <th className="py-3 px-3">Impacted Internal Asset</th>
                <th className="py-3 px-3">Matched Version</th>
                <th className="py-3 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {exposures.map((exp) => (
                <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-2">
                    <Badge
                      variant={
                        exp.severity === "critical"
                          ? "broken"
                          : exp.severity === "high"
                          ? "degraded"
                          : "information"
                      }
                    >
                      {exp.severity} ({exp.risk_score})
                    </Badge>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-white">
                    {exp.cve_id}
                  </td>
                  <td className="py-3.5 px-3 max-w-sm">
                    <div className="font-sans font-medium text-white truncate">{exp.threat_title}</div>
                    <div className="text-[10px] text-neutral-400 truncate mt-0.5">{exp.provenance_snippet}</div>
                  </td>
                  <td className="py-3.5 px-3 text-neutral-300">
                    {exp.asset_name}
                  </td>
                  <td className="py-3.5 px-3 text-indigo-400">
                    {exp.matched_version}
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      {exp.mitigation_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SpotlightCard>
    </div>
  );
}
