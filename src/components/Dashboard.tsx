import React, { useState } from 'react';
import {
  ArrowUpRight,
  Filter,
  ChevronDown,
  BarChart3,
  Layers,
  TrendingUp,
  Download,
  FileText,
  Check,
  Zap,
  Compass,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Brain,
  Sparkles,
} from 'lucide-react';
import { RepositoryModel } from '../types/atlas';
import { generateRepositoryPdfReport } from '../utils/pdfGenerator';
import { HealthTrendChart } from './HealthTrendChart';
import { CognitiveLoadWidget } from './CognitiveLoadWidget';
import { ArchitecturePreviewWidget } from './ArchitecturePreviewWidget';
import { AnimatedNumber } from '../hooks/useAnimatedNumber';

interface DashboardProps {
  repo: RepositoryModel;
  onNavigateTab: (tab: string, extra?: any) => void;
  onAnalyzeFileImpact: (filePath: string) => void;
  onOpenIngestModal?: () => void;
  onLoadSample?: (sampleId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  repo,
  onNavigateTab,
  onAnalyzeFileImpact,
  onOpenIngestModal,
  onLoadSample,
}) => {
  const { graph } = repo;

  // Filter Pill state
  const [activeFilter, setActiveFilter] = useState<'overview' | 'coupling' | 'cognitive' | 'hotspots' | 'history'>('overview');
  const [timeframe, setTimeframe] = useState<'30days' | '7days' | 'quarter'>('30days');
  const [exported, setExported] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  // Computations
  const totalLines = repo.files.reduce((a, b) => a + b.linesCount, 0);
  const totalSymbols = repo.files.reduce((a, b) => a + b.symbols.length, 0);

  // Export handlers
  const handleExportJson = () => {
    const report = {
      platform: "ATLAS — Project Intelligence Platform",
      generatedAt: new Date().toISOString(),
      repository: {
        name: repo.name,
        fullName: repo.fullName,
        description: repo.description,
        branch: repo.branch,
        languages: repo.languages,
      },
      metrics: {
        totalFiles: repo.files.length,
        totalLines,
        totalSymbols,
        healthScore: graph.metrics.healthScore,
        couplingHotspots: graph.couplingHotspots.length,
        circularDependencies: graph.circularDependencies.length,
      },
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${repo.name.toLowerCase()}_atlas_summary.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  const handleDownloadPdf = () => {
    try {
      generateRepositoryPdfReport(repo);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  };

  // Subsystem cluster distribution for the bar chart based on actual repository counts
  const maxClusterCount = Math.max(
    1,
    ...(['Frontend', 'API Layer', 'Auth & Security', 'Services', 'Database', 'Configuration'] as const).map(
      (c) => graph.clusters[c]?.length || 0
    )
  );

  const barChartData = ([
    { label: 'Frontend', count: graph.clusters['Frontend']?.length || 0 },
    { label: 'API Layer', count: graph.clusters['API Layer']?.length || 0 },
    { label: 'Auth & Sec', count: graph.clusters['Auth & Security']?.length || 0 },
    { label: 'Services', count: graph.clusters['Services']?.length || 0 },
    { label: 'Database', count: graph.clusters['Database']?.length || 0 },
    { label: 'Config', count: graph.clusters['Configuration']?.length || 0 },
  ]).map((b) => ({
    ...b,
    height: `${Math.max(18, Math.round((b.count / maxClusterCount) * 95))}%`,
    isHigh: b.count === maxClusterCount && b.count > 0,
  }));

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-[1600px] mx-auto text-slate-100">
      {/* 1. Page Header Headline from Design */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight"
          >
            Architecture &amp; Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time codebase health and dependency insights at a glance.
          </p>
        </div>

        {/* Action Buttons: Analyze & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('impact')}
            className="flex items-center gap-2 rounded-full bg-[#d4ff59] px-4 py-2 text-xs font-bold text-black shadow-lg shadow-[#d4ff59]/20 hover:scale-105 transition"
          >
            <Zap className="h-3.5 w-3.5 fill-black" />
            <span>Analyze What Breaks</span>
          </button>

          <button
            onClick={() => onNavigateTab('architecture')}
            className="flex items-center gap-2 rounded-full border border-[#232635] bg-[#14151e] px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-700 hover:bg-[#1a1c27] transition"
          >
            <Compass className="h-3.5 w-3.5 text-purple-400" />
            <span>Architecture Map</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-950/40 px-3.5 py-2 text-xs font-semibold text-purple-200 hover:bg-purple-900/60 transition"
            title="Download PDF report"
          >
            {pdfSuccess ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <FileText className="h-3.5 w-3.5 text-purple-300" />}
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-2 rounded-full border border-[#232635] bg-[#14151e] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            title="Export JSON state"
          >
            {exported ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Download className="h-3.5 w-3.5 text-slate-400" />}
            <span className="hidden sm:inline">JSON</span>
          </button>
        </div>
      </div>

      {/* Fresh Start Clean Slate Banner when 0 modules */}
      {repo.files.length === 0 && (
        <div className="rounded-[2rem] border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-slide-up">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4ff59] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#d4ff59]"></span>
                </span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#d4ff59]">
                  Fresh Workspace Initialized • Zero Baselines
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                Clean Slate Ready for Ingestion
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                All architectural metrics, AST symbols, coupling hotspots, and recursion cycle counters start at 0. Connect any public GitHub repository or load curated demonstration projects to immediately visualize complete architectural topologies.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              {onOpenIngestModal && (
                <button
                  onClick={onOpenIngestModal}
                  className="flex items-center gap-2 rounded-xl bg-[#d4ff59] px-4 py-3 text-xs font-bold text-black shadow-lg shadow-[#d4ff59]/20 hover:scale-105 active:scale-95 transition"
                >
                  <Zap className="h-4 w-4 fill-black" />
                  <span>Ingest GitHub Repo</span>
                </button>
              )}
              {onLoadSample && (
                <button
                  onClick={() => onLoadSample('nexus-commerce')}
                  className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-3 text-xs font-semibold text-slate-200 hover:border-slate-600 hover:bg-slate-700 hover:scale-105 active:scale-95 transition"
                >
                  <Layers className="h-4 w-4 text-purple-400" />
                  <span>Load Demo (NexusCommerce)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Top Two Hero Cards (Dark Card & Neon Lime Hero Card from Image) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Dark Rounded Hero Card */}
        <div className="rounded-[2rem] border border-[#232635] bg-[#14151e] p-6 sm:p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden group ui-card-interactive">
          <div className="flex items-start justify-between">
            <span className="text-sm font-medium text-slate-400 font-mono">
              Total Lines of Code
            </span>
            <button
              onClick={() => onNavigateTab('explorer')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/15 transition group-hover:scale-110"
              title="Inspect Code Explorer"
            >
              <ArrowUpRight className="h-5 w-5" />
            </button>
          </div>

          <div className="my-5">
            <div
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-4xl sm:text-5xl font-black tracking-tight text-white"
            >
              <AnimatedNumber value={totalLines} />
            </div>
            <div className="text-xs font-mono text-emerald-400 font-medium mt-1.5 flex items-center gap-1.5">
              <span>+<AnimatedNumber value={repo.files.length} /> indexed files</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400"><AnimatedNumber value={graph.edges.length} /> graph relations</span>
            </div>
          </div>
        </div>

        {/* Card 2: Vibrant Neon Lime Hero Card from Image */}
        <div className="rounded-[2rem] bg-[#d4ff59] p-6 sm:p-7 flex flex-col justify-between shadow-2xl shadow-[#d4ff59]/10 text-black relative group ui-card-interactive">
          <div className="flex items-start justify-between">
            <span className="text-sm font-bold font-mono tracking-tight text-black/80">
              Active AST Symbols &amp; Health
            </span>
            <button
              onClick={() => onNavigateTab('dependencies')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10 text-black hover:bg-black/20 transition group-hover:scale-110"
              title="Inspect Dependencies"
            >
              <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>

          <div className="my-5">
            <div
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-4xl sm:text-5xl font-black tracking-tight text-black"
            >
              <AnimatedNumber value={totalSymbols} />
            </div>
            <div className="text-xs font-mono font-bold text-black/80 mt-1.5 flex items-center gap-1.5">
              <span><AnimatedNumber value={graph.metrics.healthScore} suffix="%" /> Graph Integrity</span>
              <span>•</span>
              <span>{graph.circularDependencies.length === 0 ? 'Zero recursion cycles' : `${graph.circularDependencies.length} cycles`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Pills Navigation Bar from Image */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Left: Rounded Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveFilter('overview')}
            className={`rounded-full px-5 py-2 text-xs font-bold transition ${
              activeFilter === 'overview'
                ? 'bg-[#d4ff59] text-black shadow-md shadow-[#d4ff59]/20'
                : 'border border-[#232635] bg-[#14151e] text-slate-300 hover:bg-[#1a1c27]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveFilter('coupling')}
            className={`rounded-full px-5 py-2 text-xs font-bold transition ${
              activeFilter === 'coupling'
                ? 'bg-[#d4ff59] text-black shadow-md shadow-[#d4ff59]/20'
                : 'border border-[#232635] bg-[#14151e] text-slate-300 hover:bg-[#1a1c27]'
            }`}
          >
            Coupling
          </button>
          <button
            onClick={() => setActiveFilter('cognitive')}
            className={`rounded-full px-5 py-2 text-xs font-bold transition ${
              activeFilter === 'cognitive'
                ? 'bg-[#d4ff59] text-black shadow-md shadow-[#d4ff59]/20'
                : 'border border-[#232635] bg-[#14151e] text-slate-300 hover:bg-[#1a1c27]'
            }`}
          >
            Cognitive Load
          </button>
          <button
            onClick={() => setActiveFilter('hotspots')}
            className={`rounded-full px-5 py-2 text-xs font-bold transition ${
              activeFilter === 'hotspots'
                ? 'bg-[#d4ff59] text-black shadow-md shadow-[#d4ff59]/20'
                : 'border border-[#232635] bg-[#14151e] text-slate-300 hover:bg-[#1a1c27]'
            }`}
          >
            Hotspots
          </button>
          <button
            onClick={() => setActiveFilter('history')}
            className={`rounded-full px-5 py-2 text-xs font-bold transition ${
              activeFilter === 'history'
                ? 'bg-[#d4ff59] text-black shadow-md shadow-[#d4ff59]/20'
                : 'border border-[#232635] bg-[#14151e] text-slate-300 hover:bg-[#1a1c27]'
            }`}
          >
            30-Day History
          </button>
        </div>

        {/* Right: Timeframe Dropdown & Purple Filter Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-[#232635] bg-[#14151e] px-4 py-2 text-xs font-medium text-slate-300">
            <span>This Month</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </div>

          <button
            onClick={() => onNavigateTab('dependencies')}
            className="flex items-center gap-1.5 rounded-full bg-[#8b5cf6] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-500/25 hover:bg-purple-600 transition"
          >
            <Filter className="h-3.5 w-3.5 fill-white" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* 4. Bottom 3-Card Grid matching the Image Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Subsystem Bar Chart Card with purple circle icon */}
        <div className="rounded-[2rem] border border-[#232635] bg-[#14151e] p-6 flex flex-col justify-between shadow-xl ui-card-interactive">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 font-mono">
                  Subsystem Breakdown
                </span>
                <div
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  className="text-2xl font-black text-white mt-0.5"
                >
                  <AnimatedNumber value={totalLines} />
                </div>
              </div>
              {/* Purple Circle Icon */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8b5cf6] text-white shadow-md shadow-purple-500/30">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>

            {/* Vertical Bar Chart matching screenshot or clean zero state */}
            {repo.files.length === 0 ? (
              <div className="mt-6 h-44 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-4 text-center">
                <div className="h-10 w-10 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500 mb-2">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="text-xs font-mono font-bold text-slate-300">0 Subsystem Tiers</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Ingest a repository to map code lines per tier</div>
              </div>
            ) : (
              <div className="mt-6 h-44 flex items-end justify-between gap-3 px-2 pb-2 border-b border-slate-800/80">
                {barChartData.map((bar, idx) => (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="relative w-full flex items-end justify-center h-full">
                      <div
                        style={{ height: bar.height }}
                        className={`w-full max-w-[32px] rounded-t-xl transition-all duration-700 ease-out ${
                          bar.isHigh
                            ? 'bg-[#a855f7] shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                            : 'bg-[#4c1d95] hover:bg-[#6b21a8]'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300 truncate max-w-[40px]">
                      0{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 flex justify-between text-[10px] font-mono text-slate-500 px-1">
              <span>{repo.files.length === 0 ? 'No active tiers' : 'Frontend ➔ DB Tiers'}</span>
              <span className="text-purple-400">{repo.files.length === 0 ? 'Baseline: 0 LoC' : 'Peak: Auth (Ca=7)'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Bubble / Packing Diagram Card with lime circle icon */}
        <div className="rounded-[2rem] border border-[#232635] bg-[#14151e] p-6 flex flex-col justify-between shadow-xl ui-card-interactive">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 font-mono">
                  Architecture Clusters
                </span>
                <div
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  className="text-2xl font-black text-white mt-0.5"
                >
                  <AnimatedNumber value={repo.files.length} /> Modules
                </div>
              </div>
              {/* Neon Lime Circle Icon */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4ff59] text-black shadow-md shadow-[#d4ff59]/30">
                <Layers className="h-5 w-5 stroke-[2.2]" />
              </div>
            </div>

            {/* Bubble cluster chart reproducing the screenshot or clean zero state */}
            {repo.files.length === 0 ? (
              <div className="mt-5 h-44 relative flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-4 text-center">
                <div className="h-10 w-10 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500 mb-2">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="text-xs font-mono font-bold text-slate-300">0 Active Clusters</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Ingest a repository to cluster modules</div>
              </div>
            ) : (
              <div className="mt-5 h-44 relative flex items-center justify-center">
                {/* Main large circle (Auth & Core in ATLAS) */}
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center font-extrabold text-[11px] shadow-lg transition-transform duration-300 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--theme-accent, #d4ff59)',
                    color: 'var(--theme-accent-contrast, #000000)',
                    boxShadow: '0 0 20px rgba(var(--theme-accent-rgb, 212, 255, 89), 0.35)',
                  }}
                >
                  Auth &amp; Core
                </div>
                {/* Surrounding satellite circles */}
                <div
                  className="absolute top-2 right-12 w-11 h-11 rounded-full flex items-center justify-center font-bold text-[9px] transition-transform duration-300 hover:scale-110 shadow-md"
                  style={{
                    backgroundColor: 'var(--theme-accent, #d4ff59)',
                    opacity: 0.88,
                    color: 'var(--theme-accent-contrast, #000000)',
                  }}
                >
                  API
                </div>
                <div
                  className="absolute top-8 right-5 w-9 h-9 rounded-full flex items-center justify-center font-bold text-[8px] transition-transform duration-300 hover:scale-110 shadow-md"
                  style={{
                    backgroundColor: 'var(--theme-accent, #d4ff59)',
                    opacity: 0.72,
                    color: 'var(--theme-accent-contrast, #000000)',
                  }}
                >
                  UI
                </div>
                <div
                  className="absolute bottom-5 right-10 w-11 h-11 rounded-full flex items-center justify-center font-bold text-[8.5px] transition-transform duration-300 hover:scale-110 shadow-md"
                  style={{
                    backgroundColor: 'var(--theme-accent-dark, #84cc16)',
                    color: '#ffffff',
                  }}
                >
                  Database
                </div>
                <div
                  className="absolute bottom-3 left-12 w-8 h-8 rounded-full flex items-center justify-center font-bold text-[7.5px] transition-transform duration-300 hover:scale-110 shadow-md"
                  style={{
                    backgroundColor: 'var(--theme-accent-dark, #65a30d)',
                    opacity: 0.85,
                    color: '#ffffff',
                  }}
                >
                  Config
                </div>
              </div>
            )}
            <div className="mt-2 text-center text-[10px] font-mono text-slate-400">
              {repo.files.length === 0 ? 'Radial Packing: Clean Workspace' : 'Radial Packing of Subsystem Dependencies'}
            </div>
          </div>
        </div>

        {/* Card 3: Line Chart Card with purple circle icon */}
        <div className="rounded-[2rem] border border-[#232635] bg-[#14151e] p-6 flex flex-col justify-between shadow-xl ui-card-interactive">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 font-mono">
                  30-Day Stability
                </span>
                <div
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  className="text-2xl font-black text-white mt-0.5"
                >
                  <AnimatedNumber value={graph.metrics.healthScore} suffix="%" />
                </div>
              </div>
              {/* Purple Circle Icon */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8b5cf6] text-white shadow-md shadow-purple-500/30">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            {/* Smooth Purple Line Curve reproducing screenshot or zero baseline */}
            <div className="mt-5 h-44 relative flex items-center">
              <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
                {/* Horizontal grid lines */}
                <line x1="0" y1="20" x2="200" y2="20" stroke="#1f2231" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="200" y2="50" stroke="#1f2231" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="200" y2="80" stroke="#1f2231" strokeDasharray="3 3" />

                {repo.files.length === 0 ? (
                  <>
                    <path
                      d="M 5 95 L 195 95"
                      fill="none"
                      stroke="#475569"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                    <circle cx="100" cy="95" r="3" fill="#64748b" />
                    <text x="100" y="85" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">
                      Zero Telemetry Baseline
                    </text>
                  </>
                ) : (
                  <>
                    {/* Purple wave path from screenshot */}
                    <path
                      d="M 5 95 L 45 65 L 75 80 L 105 30 L 135 55 L 165 20 L 195 65"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Glowing points */}
                    <circle cx="105" cy="30" r="3" fill="#d4ff59" />
                    <circle cx="165" cy="20" r="3.5" fill="#c084fc" />
                  </>
                )}
              </svg>
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-mono text-slate-500">
              <span>Day -30</span>
              <span className="text-emerald-400">{repo.files.length === 0 ? 'Baseline: 0%' : '+12% Net Decoupling'}</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Architecture Preview SVG Canvas Widget */}
      <ArchitecturePreviewWidget
        repo={repo}
        onAnalyzeFileImpact={onAnalyzeFileImpact}
        onNavigateToCode={(filePath) => onNavigateTab('explorer', { filePath })}
      />

      {/* 5. Deep Analysis Sections based on Active Filter Pill */}
      {activeFilter === 'cognitive' && (
        <div className="pt-2">
          <CognitiveLoadWidget
            repo={repo}
            onNavigateToCode={(filePath) => onNavigateTab('explorer', { filePath })}
            onAnalyzeFileImpact={onAnalyzeFileImpact}
          />
        </div>
      )}

      {activeFilter === 'history' && (
        <div className="pt-2">
          <HealthTrendChart repo={repo} />
        </div>
      )}

      {activeFilter === 'coupling' && (
        <div className="rounded-[2rem] border border-[#232635] bg-[#14151e] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400" />
              Coupling Hotspots Analysis
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {graph.couplingHotspots.length} high-risk modules
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {graph.couplingHotspots.map((hotspot) => (
              <div
                key={hotspot.filePath}
                className="rounded-2xl border border-[#262838] bg-[#0f1017] p-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-mono font-bold text-slate-200">
                    {hotspot.filePath}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    Callers (Ca): {hotspot.afferentCoupling} • Imports (Ce): {hotspot.efferentCoupling}
                  </div>
                </div>
                <button
                  onClick={() => onAnalyzeFileImpact(hotspot.filePath)}
                  className="rounded-full bg-[#d4ff59] px-3 py-1 text-xs font-bold text-black"
                >
                  Analyze
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeFilter === 'overview' && (
        <div className="space-y-6 pt-2">
          {/* Cognitive Load overview */}
          <CognitiveLoadWidget
            repo={repo}
            onNavigateToCode={(filePath) => onNavigateTab('explorer', { filePath })}
            onAnalyzeFileImpact={onAnalyzeFileImpact}
          />

          {/* 30-Day Trend */}
          <HealthTrendChart repo={repo} />
        </div>
      )}
    </div>
  );
};
