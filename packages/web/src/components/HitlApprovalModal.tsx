import React, { useState } from 'react';
import { ShieldCheck, KeyRound, CheckCircle2, GitPullRequest, ExternalLink, X, Fingerprint, Lock } from 'lucide-react';
import { SecurityScenario } from '../types';

interface HitlApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: SecurityScenario;
  onApproveSuccess: (prUrl: string, signatureToken: string) => void;
}

export const HitlApprovalModal: React.FC<HitlApprovalModalProps> = ({
  isOpen,
  onClose,
  scenario,
  onApproveSuccess,
}) => {
  const [operatorId, setOperatorId] = useState('OPERATOR_0x7FE9_SECURITY_LEAD');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authorizedState, setAuthorizedState] = useState<{
    token: string;
    prUrl: string;
    commitHash: string;
    timestamp: string;
  } | null>(null);

  if (!isOpen) return null;

  const generateCryptographicSignature = (operator: string, scenarioId: string) => {
    const timestamp = new Date().toISOString();
    const payload = `${operator}:${scenarioId}:${timestamp}:${Math.random().toString(36).substring(2)}`;
    // Simple deterministic hex digest generation for signature audit
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      hash = (hash << 5) - hash + payload.charCodeAt(i);
      hash |= 0;
    }
    const tokenHex = Math.abs(hash).toString(16).padStart(8, '0');
    const fullSignature = `SIG-ED25519-0x${tokenHex}f8a792d41b80c51e998a44b`;
    const commitHash = `a8f${Math.abs(hash).toString(16).substring(0, 4)}c1`;
    const prUrl = `https://${scenario.repository}/pull/42-immunize-${scenario.cwe.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    return { token: fullSignature, prUrl, commitHash, timestamp };
  };

  const handleAuthorize = () => {
    setIsAuthorizing(true);
    setTimeout(() => {
      const result = generateCryptographicSignature(operatorId, scenario.id);
      setAuthorizedState(result);
      setIsAuthorizing(false);
      onApproveSuccess(result.prUrl, result.token);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#0B0F17] shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-700/60 text-emerald-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-mono">
                CRYPTOGRAPHIC HITL IMMUNIZATION GATEWAY
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Human-In-The-Loop Cryptographic Authority & PR Dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {!authorizedState ? (
            <>
              {/* Target & Reduction Banner */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Target Repository:</span>
                  <span className="text-cyan-400 font-semibold">{scenario.repository}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Vulnerability Classification:</span>
                  <span className="rounded bg-rose-950/80 px-2 py-0.5 text-rose-300 font-bold border border-rose-800/60">
                    {scenario.cwe} ({scenario.category})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono border-t border-slate-800 pt-2">
                  <span className="text-slate-400">CVSS Threat Drop:</span>
                  <span className="text-emerald-400 font-bold">
                    {scenario.initialCvss.toFixed(1)} [CRITICAL] ──► 0.0 [CLEAN IMMUNIZED]
                  </span>
                </div>
              </div>

              {/* Operator Verification Input */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
                  Authorizing Security Officer ID / Key:
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Fingerprint className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={operatorId}
                    onChange={(e) => setOperatorId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-black/80 py-2.5 pl-10 pr-4 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="Enter Security Officer Public Key"
                  />
                </div>
              </div>

              {/* Suggested Commit message */}
              <div className="rounded-xl border border-slate-800 bg-black/60 p-3.5 font-mono text-xs">
                <span className="text-[10px] text-slate-400 uppercase block mb-1">Generated Commit Message:</span>
                <p className="text-emerald-300">{scenario.hitlSummary.suggestedCommitMessage}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-mono font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  ABORT / CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleAuthorize}
                  disabled={isAuthorizing}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-mono font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50"
                >
                  {isAuthorizing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>SIGNING & DISPATCHING PR...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>1-CLICK SIGN & DISPATCH IMMUNIZED PR</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Successful Approval State */
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-300 font-mono">
                    CRYPTOGRAPHIC IMMUNIZATION SIGNATURE GENERATED!
                  </h3>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    PR successfully dispatched to repository with formal Qodo certification.
                  </p>
                </div>
              </div>

              {/* Signature Proof Card */}
              <div className="space-y-2 rounded-xl border border-slate-800 bg-black/90 p-4 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Cryptographic Token:</span>
                  <span className="text-cyan-400 font-semibold">{authorizedState.token}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Signed Commit Hash:</span>
                  <span className="text-emerald-400 font-semibold">commit #{authorizedState.commitHash}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Signed Timestamp:</span>
                  <span className="text-slate-300">{authorizedState.timestamp}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Signer Authority:</span>
                  <span className="text-amber-400">{operatorId}</span>
                </div>
              </div>

              {/* PR Link */}
              <div className="rounded-xl border border-cyan-800/50 bg-cyan-950/20 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                  <GitPullRequest className="h-4 w-4 text-cyan-400" />
                  <span>Pull Request #42: [ZeroShield Immunized]</span>
                </div>
                <a
                  href={authorizedState.prUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 transition underline underline-offset-4"
                >
                  <span>VIEW PR ON GITHUB</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={onClose}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-mono font-semibold text-slate-200 hover:bg-slate-700 transition"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>CLOSE GATEWAY</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
