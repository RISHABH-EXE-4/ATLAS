import React, { useState, useMemo } from 'react';
import {
  Lightbulb,
  Search,
  Sparkles,
  Layers,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Key,
  ExternalLink,
} from 'lucide-react';
import { RepositoryModel, FeatureImpactAnalysis } from '../types/atlas';
import { getStoredGeminiApiKey, setStoredGeminiApiKey, getAiHeaders } from '../utils/aiClient';

interface FeatureImpactAnalyzerProps {
  repo: RepositoryModel;
  onNavigateToCode: (filePath: string) => void;
  apiKey?: string;
  onNavigateToSettings?: () => void;
  onSaveApiKey?: (key: string) => void;
}

export const FeatureImpactAnalyzer: React.FC<FeatureImpactAnalyzerProps> = ({
  repo,
  onNavigateToCode,
  apiKey,
  onNavigateToSettings,
  onSaveApiKey,
}) => {
  const [inlineKeyInput, setInlineKeyInput] = useState('');
  const [inlineKeySaved, setInlineKeySaved] = useState(false);
  const activeApiKey = (apiKey && apiKey.trim().length > 0 ? apiKey : getStoredGeminiApiKey()).trim();
  const isNative = useMemo(() => {
    const langs = Object.keys(repo.languages).map(l => l.toLowerCase());
    return langs.some(l => l.includes('c++') || l.includes('c') || l.includes('rust') || l.includes('cmake'));
  }, [repo.languages]);

  const presets = useMemo(() => {
    if (isNative) {
      return [
        'Add Vulkan compute shader rendering pipeline',
        'Implement dynamic NID relocation table patch',
        'Add multithreaded JPEG stream decoder',
        'Optimize page table virtual memory allocator',
      ];
    }
    const isPy = Object.keys(repo.languages).some(l => l.toLowerCase().includes('python'));
    if (isPy) {
      return [
        'Add async background queue worker',
        'Implement Redis cache for user sessions',
        'Add rate limiting to API routes',
        'Add OpenAPI request schema validation',
      ];
    }
    return [
      'Add Google OAuth login',
      'Add rate limiting to API routes',
      'Implement Redis cache for user sessions',
      'Add Stripe webhook subscription events',
    ];
  }, [isNative, repo.languages]);

  const [prompt, setPrompt] = useState(presets[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<FeatureImpactAnalysis | null>(null);

  React.useEffect(() => {
    setPrompt(presets[0]);
    setAnalysis(null);
  }, [repo.id]);

  const [authError, setAuthError] = useState<string | null>(null);

  const handleRunAnalysis = async (featureText: string) => {
    const effectiveKey = (activeApiKey || inlineKeyInput.trim()).trim();

    if (!effectiveKey) {
      setAuthError('Google AI Studio API Key is required to perform AI feature impact analysis. Please activate your key below or in Settings.');
      return;
    }

    setAuthError(null);
    setIsLoading(true);
    setAnalysis(null);

    try {
      const response = await fetch('/api/ai/impact', {
        method: 'POST',
        headers: getAiHeaders(effectiveKey),
        body: JSON.stringify({
          featureDescription: featureText,
          apiKey: effectiveKey,
          repoContext: {
            name: repo.name,
            languages: repo.languages,
            filesCount: repo.files.length,
          },
          graphSummary: {
            topModules: Object.keys(repo.graph.clusters),
            hotspots: repo.graph.couplingHotspots.map(h => h.filePath),
          },
        }),
      });

      if (response.status === 401) {
        const errData = await response.json().catch(() => ({}));
        setAuthError(errData.error || 'Google AI Studio API Key is required or invalid.');
        return;
      }

      if (!response.ok) throw new Error('Impact analysis request failed');
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
      setAuthError(err?.message || 'Error executing AI impact analysis.');
    } finally {
      setIsLoading(false);
    }
  };

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
                  Proactive impact prediction and AI code forecasting require a Google AI Studio API key.
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
                }
              }}
              disabled={!inlineKeyInput.trim()}
              className="rounded-xl bg-[#d4ff59] px-4 py-1.5 text-xs font-mono font-bold text-black hover:opacity-90 disabled:opacity-40 transition"
            >
              {inlineKeySaved ? 'Activated!' : 'Save & Activate'}
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

      {/* Header */}
      <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/20 via-slate-900 to-slate-900 p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-400 border border-indigo-500/30">
            PROACTIVE INTELLIGENCE
          </span>
          <span className="text-xs font-mono text-slate-400">
            Pre-implementation Blast Prediction
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white font-mono flex items-center gap-2.5">
          <Lightbulb className="h-6 w-6 text-indigo-400" />
          Feature Impact Analyzer
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
          Predict which subsystems, existing files, and new modules will be required before you write a single line of code.
        </p>

        {/* Input box */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Add Google OAuth login, Add Stripe webhooks, Add rate limiting..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs sm:text-sm font-mono text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => handleRunAnalysis(prompt)}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>Analyze Feature Impact</span>
          </button>
        </div>

        {/* Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500">Presets:</span>
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setPrompt(preset);
                handleRunAnalysis(preset);
              }}
              className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 text-[11px] font-mono text-slate-300 hover:border-slate-700 hover:text-white transition"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Critical Principle Callout from PRD */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-emerald-400 font-mono">OBSERVED:</span>
          <span className="text-slate-300">Directly verified in repository code graph & AST.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-purple-400" />
          <span className="font-semibold text-purple-400 font-mono">AI INFERENCE:</span>
          <span className="text-slate-300">Projected engineering recommendation based on architecture patterns.</span>
        </div>
      </div>

      {/* Analysis Output */}
      {analysis && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-2">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Impact Assessment Summary
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {analysis.summary}
            </p>
          </div>

          {/* Subsystems & Files Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Affected Subsystems */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                Likely Affected Areas
              </h3>

              <div className="space-y-2.5">
                {analysis.affectedSubsystems.map((sub, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 font-mono">
                        {sub.name}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase border ${
                          sub.impact === 'HIGH'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : sub.impact === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {sub.impact} IMPACT
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {sub.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Files to Investigate (Observed vs AI Inference) */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <FileCode className="h-4 w-4 text-indigo-400" />
                Files to Investigate
              </h3>

              <div className="space-y-2.5">
                {analysis.filesToInvestigate.map((item, idx) => {
                  const isObserved = item.type === 'OBSERVED';
                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="text-xs font-mono font-bold text-slate-200 truncate">
                            {item.filePath}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase border ${
                              isObserved
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            }`}
                          >
                            {item.type}
                          </span>
                          <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] font-mono text-slate-400 uppercase">
                            {item.action}
                          </span>
                        </div>

                        {repo.fileMap[item.filePath] && (
                          <button
                            onClick={() => onNavigateToCode(item.filePath)}
                            className="text-[11px] font-mono text-indigo-400 hover:underline shrink-0 flex items-center gap-1"
                          >
                            <span>Open</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        {item.reason}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Potential Breakages & Suggested Tests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-rose-900/40 bg-rose-950/10 p-5 space-y-3">
              <h3 className="text-sm font-bold text-rose-300 font-mono uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                Potential Breakages & Edge Cases
              </h3>
              <ul className="space-y-2 text-xs text-rose-200/90 list-disc list-inside">
                {analysis.potentialBreakages.map((b, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/10 p-5 space-y-3">
              <h3 className="text-sm font-bold text-indigo-300 font-mono uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                Recommended Regression Tests
              </h3>
              <ul className="space-y-2 text-xs text-indigo-200/90 list-disc list-inside">
                {analysis.suggestedTests.map((t, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
