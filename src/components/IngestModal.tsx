import React, { useState } from 'react';
import {
  Github,
  CheckCircle2,
  Loader2,
  X,
  AlertCircle,
  ArrowRight,
  GitBranch,
  Layers,
  Sparkles,
  Zap,
  Compass,
  FileCode,
  Box,
  Check,
  ChevronRight,
} from 'lucide-react';
import { RepositoryModel, ModuleCluster } from '../types/atlas';
import {
  synthesizeCompleteRepository,
  SyntheticPipelineReport,
} from '../engine/syntheticModuleGenerator';

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepositoryIngested: (newRepo: RepositoryModel, targetTab?: string) => void;
}

export const IngestModal: React.FC<IngestModalProps> = ({
  isOpen,
  onClose,
  onRepositoryIngested,
}) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [synthesisResult, setSynthesisResult] = useState<{
    repo: RepositoryModel;
    report: SyntheticPipelineReport;
  } | null>(null);

  // Ingestion progress stages
  const [stages, setStages] = useState<
    Array<{ label: string; detail: string; status: 'pending' | 'active' | 'done' }>
  >([
    { label: 'GitHub API Tree Extraction', detail: 'Recursive blob & tree extraction via REST API', status: 'pending' },
    { label: 'File Structure Topology Parsing', detail: 'Vendor filtering & directory tree indexing', status: 'pending' },
    { label: 'Core Entry Point Identification', detail: 'Detecting main runtime entries & build targets', status: 'pending' },
    { label: 'Synthetic Module Metadata Generation', detail: 'Synthesizing module tiers, symbols & purposes', status: 'pending' },
    { label: 'Dependency Graph & Blast Radius Synthesis', detail: 'Inferring inter-tier links & coupling vectors', status: 'pending' },
    { label: 'Architecture Map Assembly', detail: 'Compiling interactive graph nodes & layout tiers', status: 'pending' },
  ]);

  if (!isOpen) return null;

  const popularRepos = [
    { name: 'boykopovar/AnyPS5', url: 'https://github.com/boykopovar/AnyPS5', tag: 'C++ / PS5 Architecture' },
    { name: 'pmndrs/zustand', url: 'https://github.com/pmndrs/zustand', tag: 'TypeScript / State' },
    { name: 'expressjs/express', url: 'https://github.com/expressjs/express', tag: 'Node.js / REST' },
    { name: 'fastapi/fastapi', url: 'https://github.com/fastapi/fastapi', tag: 'Python / Microservice' },
  ];

  const handleStartIngest = async (targetUrl: string) => {
    setError(null);
    setSynthesisResult(null);
    setIsAnalyzing(true);

    const updateStage = (index: number, status: 'pending' | 'active' | 'done') => {
      setStages((prev) =>
        prev.map((s, idx) => (idx === index ? { ...s, status } : s))
      );
    };

    // Reset stages to pending
    setStages((prev) => prev.map((s) => ({ ...s, status: 'pending' })));

    try {
      // Stage 0: Extract repo tree via GitHub API
      updateStage(0, 'active');
      const res = await fetch('/api/repo/github-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: targetUrl, branch }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to ingest repository from GitHub');
      }

      const data = await res.json();
      updateStage(0, 'done');

      // Stage 1: Parse structure
      updateStage(1, 'active');
      await new Promise((r) => setTimeout(r, 220));
      updateStage(1, 'done');

      // Stage 2: Identify core entry points
      updateStage(2, 'active');
      await new Promise((r) => setTimeout(r, 240));
      updateStage(2, 'done');

      // Stage 3: Generate synthetic module metadata
      updateStage(3, 'active');
      await new Promise((r) => setTimeout(r, 280));
      updateStage(3, 'done');

      // Stage 4: Build dependency graph & blast radius
      updateStage(4, 'active');
      await new Promise((r) => setTimeout(r, 240));
      updateStage(4, 'done');

      // Stage 5: Assemble Architecture Map
      updateStage(5, 'active');

      const repMeta = data.repository || {};
      const { repository: synthesizedRepo, report } = synthesizeCompleteRepository(
        {
          name: repMeta.name || 'Repository',
          fullName: repMeta.fullName || targetUrl,
          description: repMeta.description || 'Public GitHub repository',
          defaultBranch: repMeta.defaultBranch || branch || 'main',
          languages: repMeta.languages || { [repMeta.language || 'C++']: 85, Other: 15 },
          frameworks: repMeta.frameworks,
          packageManagers: repMeta.packageManagers,
          entryPoints: repMeta.entryPoints,
          configFiles: repMeta.configFiles,
          maxFiles: repMeta.maxFiles || 5000,
        },
        data.files || [],
        data.tree || []
      );

      await new Promise((r) => setTimeout(r, 200));
      updateStage(5, 'done');

      setSynthesisResult({
        repo: synthesizedRepo,
        report,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error ingesting repository');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLaunchMap = (targetTab: string = 'architecture') => {
    if (synthesisResult) {
      onRepositoryIngested(synthesisResult.repo, targetTab);
      onClose();
    }
  };

  const clusterColors: Record<ModuleCluster, { badge: string; text: string }> = {
    'Frontend': { badge: 'bg-cyan-950/60 border-cyan-800 text-cyan-300', text: 'text-cyan-400' },
    'API Layer': { badge: 'bg-indigo-950/60 border-indigo-800 text-indigo-300', text: 'text-indigo-400' },
    'Auth & Security': { badge: 'bg-rose-950/60 border-rose-800 text-rose-300', text: 'text-rose-400' },
    'Services': { badge: 'bg-emerald-950/60 border-emerald-800 text-emerald-300', text: 'text-emerald-400' },
    'Database': { badge: 'bg-amber-950/60 border-amber-800 text-amber-300', text: 'text-amber-400' },
    'Configuration': { badge: 'bg-purple-950/60 border-purple-800 text-purple-300', text: 'text-purple-400' },
    'Utilities': { badge: 'bg-slate-900 border-slate-700 text-slate-300', text: 'text-slate-400' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0f1322] shadow-2xl p-5 sm:p-7 z-10 space-y-5 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <h2
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2"
              >
                <span>GitHub Ingestion &amp; Architectural Synthesis</span>
                <span className="rounded-full bg-[#d4ff59]/15 px-2 py-0.5 text-[10px] font-mono font-bold text-[#d4ff59] border border-[#d4ff59]/30">
                  ANY PUBLIC REPO
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Extracts file trees, identifies entry points, and generates synthetic module metadata.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isAnalyzing}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 p-3.5 text-xs text-rose-300 flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Controls */}
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                GitHub Repository URL or owner/repo:
              </label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="e.g. boykopovar/AnyPS5 or expressjs/express"
                disabled={isAnalyzing}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                Branch:
              </label>
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  disabled={isAnalyzing}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs font-mono text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-[11px] font-mono text-slate-400">Popular Repositories:</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {popularRepos.map((pr) => (
                <button
                  key={pr.name}
                  onClick={() => {
                    setRepoUrl(pr.name);
                    handleStartIngest(pr.name);
                  }}
                  disabled={isAnalyzing}
                  className="rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1.5 text-[11px] font-mono text-slate-300 hover:border-indigo-500/50 hover:bg-slate-900 hover:text-white transition flex items-center gap-1.5"
                >
                  <span className="font-semibold text-indigo-400">{pr.name}</span>
                  <span className="text-[10px] text-slate-500">({pr.tag})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ingestion Pipeline Stages */}
        {(isAnalyzing || (stages.some((s) => s.status === 'done') && !synthesisResult)) && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-mono font-bold text-indigo-400 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Specialized Ingestion Pipeline Execution</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Multi-Stage AST Synthesis
              </span>
            </div>

            {stages.map((stage, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs font-mono py-1">
                <div className="mt-0.5 shrink-0">
                  {stage.status === 'done' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : stage.status === 'active' ? (
                    <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-slate-700 mx-0.5 mt-0.5" />
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className={
                      stage.status === 'done'
                        ? 'text-slate-200 font-semibold'
                        : stage.status === 'active'
                        ? 'text-indigo-400 font-bold'
                        : 'text-slate-500'
                    }
                  >
                    {stage.label}
                  </div>
                  <div className="text-[10.5px] text-slate-400 font-sans">
                    {stage.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Synthesis Result & Architectural Report Preview Card */}
        {synthesisResult && (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4.5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Architecture Model Synthesized Successfully
                </span>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                READY TO VISUALIZE
              </span>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono">
              <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2">
                <div className="text-base font-bold text-white">
                  {synthesisResult.report.totalIndexedModules}
                </div>
                <div className="text-[10px] text-slate-400">Total Modules</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2">
                <div className="text-base font-bold text-indigo-400">
                  {synthesisResult.report.realFilesCount} / {synthesisResult.report.syntheticModulesCount}
                </div>
                <div className="text-[10px] text-slate-400">Real / Synthetic</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2">
                <div className="text-base font-bold text-emerald-400">
                  {synthesisResult.report.entryPoints.length}
                </div>
                <div className="text-[10px] text-slate-400">Entry Points</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2">
                <div className="text-base font-bold text-[#d4ff59]">
                  {synthesisResult.repo.graph.edges.length}
                </div>
                <div className="text-[10px] text-slate-400">Graph Edges</div>
              </div>
            </div>

            {/* Identified Core Entry Points */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-indigo-400" />
                <span>Identified Core Entry Points:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {synthesisResult.report.entryPoints.map((ep) => (
                  <div
                    key={ep.path}
                    className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] font-mono text-slate-200"
                  >
                    <span className="font-bold text-indigo-300">{ep.name}</span>
                    <span className="rounded bg-indigo-500/20 px-1 text-[9px] text-indigo-400">
                      [{ep.category}]
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Synthesized Module Tiers Breakdown */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                <span>Synthesized Module Clusters:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(synthesisResult.report.clusterBreakdown)
                  .filter(([_, count]) => count > 0)
                  .map(([cluster, count]) => {
                    const cStyle = clusterColors[cluster as ModuleCluster] || clusterColors['Utilities'];
                    return (
                      <span
                        key={cluster}
                        className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-mono ${cStyle.badge}`}
                      >
                        {cluster}: <strong>{count}</strong>
                      </span>
                    );
                  })}
              </div>
            </div>

            {/* Sample Synthesized Modules */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Box className="h-3.5 w-3.5 text-indigo-400" />
                <span>Sample Synthesized Module Metadata:</span>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                {synthesisResult.repo.files.slice(0, 4).map((f) => (
                  <div
                    key={f.path}
                    className="flex items-start justify-between gap-2 rounded bg-slate-950/70 p-1.5 border border-slate-800/80"
                  >
                    <div className="truncate">
                      <span className="text-slate-200 font-bold">{f.name}</span>
                      <span className="text-[10px] text-slate-500 ml-2">({f.moduleCluster})</span>
                      <div className="text-[10px] text-slate-400 truncate">{f.moduleSummary}</div>
                    </div>
                    {f.isSynthetic && (
                      <span className="rounded bg-purple-500/20 px-1 py-0.5 text-[9px] text-purple-300 shrink-0">
                        SYNTHETIC
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            disabled={isAnalyzing}
            className="rounded-xl px-4 py-2 text-xs font-mono text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            Close
          </button>

          {synthesisResult ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleLaunchMap('overview')}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-mono font-medium text-slate-200 hover:bg-slate-700 transition"
              >
                <span>View Dashboard</span>
              </button>
              <button
                onClick={() => handleLaunchMap('architecture')}
                className="flex items-center gap-2 rounded-xl bg-[#d4ff59] px-5 py-2.5 text-xs font-mono font-bold text-black shadow-lg shadow-[#d4ff59]/20 hover:scale-105 transition"
              >
                <Compass className="h-4 w-4 fill-black" />
                <span>Explore Architecture Map</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleStartIngest(repoUrl)}
              disabled={isAnalyzing || !repoUrl.trim()}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-mono font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Synthesizing Modules...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 fill-white" />
                  <span>Execute Ingestion Pipeline</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
