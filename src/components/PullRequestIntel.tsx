import React, { useState, useMemo } from 'react';
import {
  GitPullRequest,
  AlertTriangle,
  CheckCircle2,
  Layers,
  FileCode,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Loader2,
  Key,
  ExternalLink,
} from 'lucide-react';
import { RepositoryModel, PRAnalysisResult } from '../types/atlas';
import { getStoredGeminiApiKey, setStoredGeminiApiKey, getAiHeaders } from '../utils/aiClient';

interface PullRequestIntelProps {
  repo: RepositoryModel;
  onNavigateToCode: (filePath: string) => void;
  apiKey?: string;
  onNavigateToSettings?: () => void;
  onSaveApiKey?: (key: string) => void;
}

export const PullRequestIntel: React.FC<PullRequestIntelProps> = ({
  repo,
  onNavigateToCode,
  apiKey,
  onNavigateToSettings,
  onSaveApiKey,
}) => {
  const [inlineKeyInput, setInlineKeyInput] = useState('');
  const [inlineKeySaved, setInlineKeySaved] = useState(false);
  const activeApiKey = (apiKey && apiKey.trim().length > 0 ? apiKey : getStoredGeminiApiKey()).trim();
  const samplePRs = useMemo(() => {
    const f = repo.files.map((file) => file.path);
    if (f.length === 0) return [];

    const hotspots = repo.graph.couplingHotspots.map((h) => h.filePath);
    const pr1Files = hotspots.slice(0, 3).length > 0 ? hotspots.slice(0, 3) : f.slice(0, 3);
    const pr2Files = f.slice(3, 6).length > 0 ? f.slice(3, 6) : f.slice(0, 2);
    const pr3Files = f.filter(
      (p) =>
        p.toLowerCase().includes('cmake') ||
        p.toLowerCase().includes('test') ||
        p.toLowerCase().includes('config') ||
        p.toLowerCase().includes('json')
    ).slice(0, 3);
    const finalPr3 = pr3Files.length > 0 ? pr3Files : f.slice(1, 3);

    return [
      {
        number: 142,
        title: `Refactor core subsystem and decouple ${pr1Files[0]?.split('/').pop() || 'engine'}`,
        author: 'core-architect',
        files: pr1Files,
      },
      {
        number: 89,
        title: `Optimize stream routines and interfaces in ${pr2Files[0]?.split('/').pop() || 'module'}`,
        author: 'systems-dev',
        files: pr2Files,
      },
      {
        number: 64,
        title: `Update build manifests and configuration targets in ${finalPr3[0]?.split('/').pop() || 'config'}`,
        author: 'infra-lead',
        files: finalPr3,
      },
    ];
  }, [repo]);

  const [selectedPR, setSelectedPR] = useState(samplePRs[0] || { number: 1, title: 'Initial PR', author: 'dev', files: [] });
  const [customTitle, setCustomTitle] = useState('');
  const [analysis, setAnalysis] = useState<PRAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [authError, setAuthError] = useState<string | null>(null);

  React.useEffect(() => {
    if (samplePRs.length > 0) {
      setSelectedPR(samplePRs[0]);
      if (activeApiKey) {
        handleAnalyzePR(samplePRs[0]);
      }
    }
  }, [repo.id, activeApiKey]);

  const handleAnalyzePR = async (prData: typeof samplePRs[0]) => {
    const effectiveKey = (activeApiKey || inlineKeyInput.trim()).trim();

    if (!effectiveKey) {
      setAuthError('Google AI Studio API Key is required to run PR intelligence. Please activate your key below or in Settings.');
      return;
    }

    setAuthError(null);
    setIsLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch('/api/ai/pr', {
        method: 'POST',
        headers: getAiHeaders(effectiveKey),
        body: JSON.stringify({
          prTitle: prData.title,
          changedFiles: prData.files,
          apiKey: effectiveKey,
          repoContext: {
            name: repo.name,
            totalFiles: repo.files.length,
          },
        }),
      });

      if (res.status === 401) {
        const errData = await res.json().catch(() => ({}));
        setAuthError(errData.error || 'Google AI Studio API Key is required or invalid.');
        return;
      }

      const data = await res.json();
      setAnalysis({
        prNumber: prData.number,
        title: prData.title,
        author: prData.author,
        changedFiles: prData.files,
        ...data.analysis,
      });
    } catch (err: any) {
      console.error(err);
      setAuthError(err?.message || 'Error executing PR analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  if (repo.files.length === 0) {
    return (
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto animate-fade-in">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-400 border border-indigo-500/30">
              CONTINUOUS VERIFICATION
            </span>
            <span className="text-xs font-mono text-slate-400">
              PR Risk & Architecture Blast Analyzer
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-mono flex items-center gap-2.5">
            <GitPullRequest className="h-6 w-6 text-indigo-400" />
            Pull Request Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
            Evaluate PR architectural ripple effects, high-risk touched paths, and reviewer focus priorities before merging into main.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <GitPullRequest className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white font-mono">No Pull Requests (Fresh Start)</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              This workspace has 0 indexed modules. Ingest a repository or load demonstration projects to simulate continuous PR verification and risk analysis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Google AI Studio API Key Banner */}
      {!activeApiKey && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-[#14151e] to-[#14151e] p-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Key className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-mono font-bold text-amber-300">
                  Google AI Studio API Key Required
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Automated Pull Request architecture risk analysis requires an active Google AI Studio API key.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-mono text-purple-300 hover:text-white underline"
              >
                <span>Get Free Key</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              {onNavigateToSettings && (
                <button
                  onClick={onNavigateToSettings}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-mono text-slate-200 hover:bg-slate-700 transition"
                >
                  Open Settings
                </button>
              )}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="password"
              value={inlineKeyInput}
              onChange={(e) => {
                setInlineKeyInput(e.target.value);
                setAuthError(null);
              }}
              placeholder="Paste Google AI Studio API Key (AQ.Ab... or AIzaSy...)"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={() => {
                const cleaned = inlineKeyInput.trim().replace(/^["']|["']$/g, '');
                if (cleaned) {
                  setStoredGeminiApiKey(cleaned);
                  onSaveApiKey?.(cleaned);
                  setInlineKeySaved(true);
                  setAuthError(null);
                  setTimeout(() => setInlineKeySaved(false), 2500);
                  if (selectedPR) handleAnalyzePR(selectedPR);
                }
              }}
              disabled={!inlineKeyInput.trim()}
              className="rounded-xl bg-[#d4ff59] px-4 py-1.5 text-xs font-mono font-bold text-black hover:opacity-90 disabled:opacity-40 transition"
            >
              {inlineKeySaved ? 'Activated!' : 'Save & Analyze'}
            </button>
          </div>
        </div>
      )}

      {/* Auth error message */}
      {authError && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs font-mono text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{authError}</span>
        </div>
      )}

      {/* Banner */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-400 border border-indigo-500/30">
            CONTINUOUS VERIFICATION
          </span>
          <span className="text-xs font-mono text-slate-400">
            PR Risk & Architecture Blast Analyzer
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white font-mono flex items-center gap-2.5">
          <GitPullRequest className="h-6 w-6 text-indigo-400" />
          Pull Request Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
          Evaluate PR architectural ripple effects, high-risk touched paths, and reviewer focus priorities before merging into main.
        </p>

        {/* PR selector buttons */}
        <div className="mt-4 flex flex-wrap gap-2.5">
          {samplePRs.map((pr) => (
            <button
              key={pr.number}
              onClick={() => {
                setSelectedPR(pr);
                handleAnalyzePR(pr);
              }}
              className={`rounded-lg border px-3 py-2 text-left text-xs font-mono transition ${
                selectedPR.number === pr.number
                  ? 'border-indigo-500 bg-indigo-600/20 text-white shadow'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="font-bold text-indigo-400">PR #{pr.number}</div>
              <div className="text-[11px] text-slate-300 truncate max-w-xs">{pr.title}</div>
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 gap-3 text-slate-400 font-mono text-xs">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          <span>Evaluating PR risk against software knowledge graph...</span>
        </div>
      )}

      {analysis && !isLoading && (
        <div className="space-y-6">
          {/* PR Overview Header */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-indigo-400 font-bold">
                  PR #{analysis.prNumber}
                </span>
                <h2 className="text-base font-bold text-white font-mono mt-0.5">
                  {analysis.title}
                </h2>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Author: <span className="text-slate-200">@{analysis.author}</span> • {analysis.changedFiles.length} files modified
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {analysis.summary}
            </p>

            {/* Changed Files badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {analysis.changedFiles.map((file) => (
                <button
                  key={file}
                  onClick={() => onNavigateToCode(file)}
                  className="rounded bg-slate-950 border border-slate-800 px-2 py-1 text-[11px] font-mono text-slate-300 hover:border-slate-700 hover:text-indigo-400 transition flex items-center gap-1.5"
                >
                  <FileCode className="h-3 w-3 text-indigo-400" />
                  <span>{file}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subsystems & Reviewer Guidance Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Architectural Impact */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                Subsystem Impact Severity
              </h3>

              <div className="space-y-2.5">
                {analysis.architectureImpact.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 font-mono">
                        {item.subsystem}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase border ${
                          item.level === 'HIGH'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : item.level === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {item.level} IMPACT
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {item.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviewer Guidance */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                Reviewer Priority Checklist
              </h3>

              <div className="space-y-2.5">
                {analysis.reviewerGuidance.map((guide, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-200 truncate">
                        {guide.filePath}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase border ${
                          guide.priority === 'MUST_REVIEW'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {guide.priority}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {guide.notes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Analysis & Dependency Shifts */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <h3 className="text-sm font-bold text-rose-300 font-mono uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              Risk Analysis & Potential Breakages
            </h3>
            <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
              {analysis.riskAnalysis.map((r, idx) => (
                <li key={idx} className="leading-relaxed">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
