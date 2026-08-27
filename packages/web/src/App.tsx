import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ThreatGauge } from './components/ThreatGauge';
import { RedBlueSplitTerminal } from './components/RedBlueSplitTerminal';
import { AstDiffViewer } from './components/AstDiffViewer';
import { HitlApprovalModal } from './components/HitlApprovalModal';
import { QodoCertificationBadge } from './components/QodoCertificationBadge';
import { TargetSelector } from './components/TargetSelector';
import { MOCK_SECURITY_SCENARIOS } from './data/mockSecurityScenarios';
import { SecurityScenario, PipelineStage } from './types';
import { ShieldCheck, Play, KeyRound, Sparkles, CheckCircle2, GitPullRequest, ExternalLink } from 'lucide-react';

export const App: React.FC = () => {
  const [scenarios] = useState<SecurityScenario[]>(MOCK_SECURITY_SCENARIOS);
  const [selectedScenario, setSelectedScenario] = useState<SecurityScenario>(MOCK_SECURITY_SCENARIOS[0]);
  const [customRepoUrl, setCustomRepoUrl] = useState('');
  
  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [stage, setStage] = useState<PipelineStage>('IMMUNIZED');
  const [currentCvss, setCurrentCvss] = useState<number>(0.0);
  const [isHitlModalOpen, setIsHitlModalOpen] = useState(false);
  const [hitlApprovalInfo, setHitlApprovalInfo] = useState<{ prUrl: string; token: string } | null>(null);

  // Synchronize CVSS on scenario change
  const handleSelectScenario = (scenario: SecurityScenario) => {
    setSelectedScenario(scenario);
    setCurrentCvss(scenario.immunizedCvss);
    setStage('IMMUNIZED');
    setIsSimulating(false);
    setHitlApprovalInfo(null);
  };

  const handleCustomScan = () => {
    if (!customRepoUrl.trim()) return;
    setIsSimulating(true);
    setStage('SCANNING');
    setCurrentCvss(9.8);
    setTimeout(() => {
      setStage('RED_EXPLOITING');
      setTimeout(() => {
        setStage('BLUE_SYNTHESIZING');
        setCurrentCvss(4.5);
        setTimeout(() => {
          setStage('AVO_TESTING');
          setCurrentCvss(1.8);
          setTimeout(() => {
            setStage('IMMUNIZED');
            setCurrentCvss(0.0);
            setIsSimulating(false);
          }, 800);
        }, 800);
      }, 900);
    }, 800);
  };

  const toggleSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      return;
    }

    setIsSimulating(true);
    setCurrentCvss(selectedScenario.initialCvss);
    setStage('RED_EXPLOITING');

    setTimeout(() => {
      setStage('BLUE_SYNTHESIZING');
      setCurrentCvss(selectedScenario.initialCvss * 0.6);

      setTimeout(() => {
        setStage('AVO_TESTING');
        setCurrentCvss(selectedScenario.initialCvss * 0.2);

        setTimeout(() => {
          setStage('IMMUNIZED');
          setCurrentCvss(0.0);
          setIsSimulating(false);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setCurrentCvss(selectedScenario.initialCvss);
    setStage('IDLE');
  };

  const handleApproveSuccess = (prUrl: string, signatureToken: string) => {
    setHitlApprovalInfo({ prUrl, token: signatureToken });
  };

  // Auto-init CVSS score
  useEffect(() => {
    setCurrentCvss(0.0);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Header activeSessionId="ZS-SES-8839-AVO" isLive={isSimulating} />

      {/* Main Content Dashboard Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* Banner Section / Notification */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-emerald-950/40 p-5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-inner">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wide text-cyan-300 uppercase">
                  ZERO-REGRESSION EXPLORE-VERIFY-OPTIMIZE (AVO) ENGINE
                </span>
                <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-800">
                  DAYTONA SANDBOX VERIFIED
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Target: <span className="text-cyan-200 font-semibold">{selectedScenario.title}</span> &bull; Identified Sink: <code className="text-rose-300 bg-rose-950/60 px-1 py-0.5 rounded">{selectedScenario.sinkIdentifier}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsHitlModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-mono font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition"
            >
              <KeyRound className="h-4 w-4" />
              <span>1-CLICK HITL APPROVAL</span>
            </button>

            <button
              onClick={toggleSimulation}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs font-mono font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              <Play className="h-3.5 w-3.5 text-cyan-400" />
              <span>{isSimulating ? 'PAUSE AVO LOOP' : 'RUN AVO LOOP'}</span>
            </button>
          </div>
        </div>

        {/* Target Scenario Selector */}
        <TargetSelector
          scenarios={scenarios}
          selectedScenarioId={selectedScenario.id}
          onSelectScenario={handleSelectScenario}
          customRepoUrl={customRepoUrl}
          onCustomRepoChange={setCustomRepoUrl}
          onRunCustomScan={handleCustomScan}
        />

        {/* Primary Row: CVSS Threat Gauge & Qodo Certification Badge */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ThreatGauge
              currentScore={currentCvss}
              initialScore={selectedScenario.initialCvss}
              cvssVector={selectedScenario.cvssVector}
              stage={stage}
              isImmunized={currentCvss === 0.0}
            />
          </div>

          <div className="lg:col-span-1">
            <QodoCertificationBadge
              certification={selectedScenario.qodoCertification}
              isApproved={Boolean(hitlApprovalInfo)}
            />
          </div>
        </div>

        {/* Approved PR Banner if HITL Approved */}
        {hitlApprovalInfo && (
          <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/30 p-4 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-900/60 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-emerald-300 uppercase">
                  HITL CRYPTOGRAPHIC PR DISPATCH CONFIRMED
                </span>
                <p className="text-[11px] font-mono text-slate-300">
                  Signature: <code className="text-cyan-300">{hitlApprovalInfo.token}</code>
                </p>
              </div>
            </div>

            <a
              href={hitlApprovalInfo.prUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-mono font-bold text-white shadow-md hover:bg-emerald-500 transition"
            >
              <GitPullRequest className="h-3.5 w-3.5" />
              <span>VIEW MERGED PR</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Red/Blue Split Terminal Visualizer */}
        <RedBlueSplitTerminal
          scenario={selectedScenario}
          activeStage={stage}
          isSimulating={isSimulating}
          onToggleSimulation={toggleSimulation}
          onResetSimulation={resetSimulation}
        />

        {/* Side-by-Side AST Diff Viewer */}
        <AstDiffViewer
          filePath={selectedScenario.vulnerableFilePath}
          diffLines={selectedScenario.diffLines}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#070A0F] py-4 text-center text-xs font-mono text-slate-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-wrap items-center justify-between gap-2">
          <span>ZeroShield v1.0.0 &bull; Autonomous Red-Team & Exploit Immunizer Engine</span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            TrueForge &bull; Daytona &bull; Qodo Grade A+ Certified
          </span>
        </div>
      </footer>

      {/* 1-Click Cryptographic HITL Approval Modal */}
      <HitlApprovalModal
        isOpen={isHitlModalOpen}
        onClose={() => setIsHitlModalOpen(false)}
        scenario={selectedScenario}
        onApproveSuccess={handleApproveSuccess}
      />
    </div>
  );
};

export default App;
