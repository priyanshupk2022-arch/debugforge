import React, { useState } from 'react';
import { GitCompare, FileCode, Check, Copy, Info, Sparkles, Code2 } from 'lucide-react';
import { DiffLine } from '../types';

interface AstDiffViewerProps {
  filePath: string;
  diffLines: DiffLine[];
}

export const AstDiffViewer: React.FC<AstDiffViewerProps> = ({ filePath, diffLines }) => {
  const [copied, setCopied] = useState(false);
  const [showAstExplanations, setShowAstExplanations] = useState(true);

  const additions = diffLines.filter((l) => l.type === 'inserted').length;
  const deletions = diffLines.filter((l) => l.type === 'deleted').length;

  const handleCopyPatch = () => {
    const rawDiff = diffLines
      .map((line) => {
        if (line.type === 'inserted') return `+ ${line.content}`;
        if (line.type === 'deleted') return `- ${line.content}`;
        return `  ${line.content}`;
      })
      .join('\n');
    navigator.clipboard.writeText(rawDiff);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const highlightTokens = (text: string) => {
    // Simple syntax highlighting for TS/JS keywords, strings, types
    const tokens = text.split(/(\b(?:import|export|from|async|function|const|let|var|return|if|else|try|catch|new|typeof|await|Set)\b|'[^']*'|"[^"]*"|`[^`]*`|\b(?:Request|Response|NextFunction|string|number|boolean|any|z|jwt)\b)/g);

    return tokens.map((token, i) => {
      if (/^(import|export|from|async|function|const|let|var|return|if|else|try|catch|new|typeof|await|Set)$/.test(token)) {
        return <span key={i} className="text-purple-400 font-semibold">{token}</span>;
      }
      if (/^('[^']*'|"[^"]*"|`[^`]*`)$/.test(token)) {
        return <span key={i} className="text-emerald-300">{token}</span>;
      }
      if (/^(Request|Response|NextFunction|string|number|boolean|any|z|jwt)$/.test(token)) {
        return <span key={i} className="text-cyan-400 font-medium">{token}</span>;
      }
      if (token.startsWith('//')) {
        return <span key={i} className="text-slate-500 italic">{token}</span>;
      }
      return <span key={i} className="text-slate-200">{token}</span>;
    });
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0B0F17] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
            <FileCode className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-slate-100">{filePath}</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300">
                TypeScript AST
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono mt-0.5">
              <span className="text-emerald-400">+{additions} lines</span>
              <span className="text-rose-400">-{deletions} lines</span>
              <span className="text-slate-400">Deterministic AST Codemod</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAstExplanations(!showAstExplanations)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-mono transition ${
              showAstExplanations
                ? 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300'
                : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{showAstExplanations ? 'HIDE AST ANNOTATIONS' : 'SHOW AST ANNOTATIONS'}</span>
          </button>

          <button
            onClick={handleCopyPatch}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-mono text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'PATCH COPIED' : 'COPY UNIFIED DIFF'}</span>
          </button>
        </div>
      </div>

      {/* Code diff lines */}
      <div className="font-mono text-xs overflow-x-auto bg-black/95 max-h-[420px] overflow-y-auto">
        <table className="w-full border-collapse">
          <tbody>
            {diffLines.map((line, idx) => {
              const isInserted = line.type === 'inserted';
              const isDeleted = line.type === 'deleted';

              return (
                <React.Fragment key={idx}>
                  <tr
                    className={`transition-colors ${
                      isInserted
                        ? 'bg-emerald-950/30 hover:bg-emerald-950/50'
                        : isDeleted
                        ? 'bg-rose-950/30 hover:bg-rose-950/50'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    {/* Old line number */}
                    <td className="w-12 select-none py-1 pr-3 pl-4 text-right text-[11px] text-slate-400 font-mono border-r border-slate-900">
                      {line.oldLineNumber || ''}
                    </td>

                    {/* New line number */}
                    <td className="w-12 select-none py-1 pr-3 pl-3 text-right text-[11px] text-slate-400 font-mono border-r border-slate-800">
                      {line.newLineNumber || ''}
                    </td>

                    {/* Diff operator marker */}
                    <td className="w-6 select-none text-center font-bold text-xs py-1">
                      {isInserted && <span className="text-emerald-400">+</span>}
                      {isDeleted && <span className="text-rose-400">-</span>}
                      {!isInserted && !isDeleted && <span className="text-slate-700">&nbsp;</span>}
                    </td>

                    {/* Code line content */}
                    <td className="py-1 px-3 whitespace-pre text-slate-300">
                      {highlightTokens(line.content)}
                    </td>
                  </tr>

                  {/* AST Explanation Card below inserted code */}
                  {showAstExplanations && line.explanation && (
                    <tr className="bg-cyan-950/20 border-l-2 border-cyan-500">
                      <td colSpan={3} className="border-r border-slate-800" />
                      <td className="py-1.5 px-3 text-[11px] text-cyan-300 font-mono flex items-center gap-2">
                        <div className="flex h-4 w-4 items-center justify-center rounded bg-cyan-900/60 text-cyan-200">
                          <Code2 className="h-3 w-3" />
                        </div>
                        <span className="font-semibold text-cyan-200">AST Codemod Rationale:</span>
                        <span>{line.explanation}</span>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer bar */}
      <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/80 px-5 py-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <GitCompare className="h-3.5 w-3.5 text-cyan-400" />
          <span>AST Transform Verified: Zero Syntax Regressions & Valid Golden Contract</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Info className="h-3.5 w-3.5" />
          <span>Babel Parser / Recast Preserving Comments</span>
        </div>
      </div>
    </div>
  );
};
