import React, { useMemo } from 'react';
import {
  Brain,
  Zap,
  Activity,
  Layers,
  FileCode,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Info,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { RepositoryModel, RepoFile } from '../types/atlas';
import { AnimatedNumber } from '../hooks/useAnimatedNumber';

interface CognitiveLoadWidgetProps {
  repo: RepositoryModel;
  onNavigateToCode: (filePath: string) => void;
  onAnalyzeFileImpact: (filePath: string) => void;
}

interface HighStrainFile {
  file: RepoFile;
  strainScore: number;
  reason: string;
  complexityCategory: 'HIGH' | 'MEDIUM';
}

export const CognitiveLoadWidget: React.FC<CognitiveLoadWidgetProps> = ({
  repo,
  onNavigateToCode,
  onAnalyzeFileImpact,
}) => {
  const { graph } = repo;

  // Compute Cognitive Load Metrics deterministically
  const cognitiveMetrics = useMemo(() => {
    if (repo.files.length === 0) {
      return {
        dependencyDensityScore: 0,
        fileComplexityScore: 0,
        couplingStrainScore: 0,
        contextSwitchingScore: 0,
        overallScore: 0,
        tier: 'LOW' as const,
        tierLabel: 'Zero Cognitive Strain (Fresh Start)',
        tierDescription: 'Workspace initialized at zero baseline. No modules or dependency friction detected.',
        tierColor: 'text-slate-400',
        tierBg: 'bg-slate-800/40 border-slate-700/50',
        ringColor: '#64748b',
        estimatedOnboarding: '0 Days (Fresh)',
        subMetrics: [
          { label: 'Dependency Density', score: 0, desc: '0 connections / file' },
          { label: 'File Complexity', score: 0, desc: '0 lines / file' },
          { label: 'Coupling Strain', score: 0, desc: '0 hotspots' },
          { label: 'Context Switching', score: 0, desc: '0 fan-out' },
        ],
        topOverloadFiles: [] as HighStrainFile[],
      };
    }

    const N = repo.files.length || 1;
    const E = graph.edges.length;

    // 1. Dependency Density (average connections per module)
    const avgConnectionsPerFile = E / N;
    const dependencyDensityScore = Math.min(
      95,
      Math.max(15, Math.round(avgConnectionsPerFile * 24))
    );

    // 2. File Complexity (lines and symbol density)
    const totalLines = repo.files.reduce((a, b) => a + b.linesCount, 0);
    const avgLines = totalLines / N;
    const totalSymbols = repo.files.reduce((a, b) => a + b.symbols.length, 0);
    const avgSymbols = totalSymbols / N;

    const fileComplexityScore = Math.min(
      95,
      Math.max(
        18,
        Math.round((avgLines / 70) * 45 + (avgSymbols / 4) * 35)
      )
    );

    // 3. Blast Radius Anxiety (coupling risk)
    const hotspotsRatio = (graph.couplingHotspots.length / N) * 100;
    const cyclePenalty = graph.circularDependencies.length * 15;
    const couplingStrainScore = Math.min(
      98,
      Math.max(10, Math.round(hotspotsRatio * 1.8 + cyclePenalty + 15))
    );

    // 4. Context Switching Friction (average fan-out)
    const avgFanOut =
      repo.files.reduce((a, b) => a + b.dependencies.length, 0) / N;
    const contextSwitchingScore = Math.min(
      95,
      Math.max(15, Math.round(avgFanOut * 28 + 12))
    );

    // Overall Composite Score (0 - 100)
    const overallScore = Math.min(
      96,
      Math.max(
        18,
        Math.round(
          0.35 * dependencyDensityScore +
          0.30 * fileComplexityScore +
          0.20 * couplingStrainScore +
          0.15 * contextSwitchingScore
        )
      )
    );

    // Rating classification
    let tier: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE' = 'LOW';
    let tierLabel = 'Low Cognitive Load';
    let tierDescription = 'Clean, modular architecture. Developers can reason about isolated modules without holding complex dependency webs in mental working memory.';
    let tierColor = 'text-emerald-400';
    let tierBg = 'bg-emerald-500/10 border-emerald-500/30';
    let ringColor = '#10b981';
    let estimatedOnboarding = '1 - 2 Days';

    if (overallScore >= 75) {
      tier = 'SEVERE';
      tierLabel = 'Severe Cognitive Load';
      tierDescription = 'High risk of cognitive overload. Complex cross-module coupling and dense dependencies require high mental effort to modify without regressions.';
      tierColor = 'text-rose-400';
      tierBg = 'bg-rose-500/10 border-rose-500/30';
      ringColor = '#f43f5e';
      estimatedOnboarding = '7 - 10 Days';
    } else if (overallScore >= 55) {
      tier = 'HIGH';
      tierLabel = 'Elevated Cognitive Load';
      tierDescription = 'Noticeable mental strain. Several central coordinator hubs require careful attention when tracing state and execution flows.';
      tierColor = 'text-amber-400';
      tierBg = 'bg-amber-500/10 border-amber-500/30';
      ringColor = '#f59e0b';
      estimatedOnboarding = '4 - 5 Days';
    } else if (overallScore >= 35) {
      tier = 'MODERATE';
      tierLabel = 'Moderate Cognitive Load';
      tierDescription = 'Well-structured with localized complexity hubs. Manageable abstractions for experienced contributors.';
      tierColor = 'text-cyan-400';
      tierBg = 'bg-cyan-500/10 border-cyan-500/30';
      ringColor = '#06b6d4';
      estimatedOnboarding = '2 - 3 Days';
    }

    // Top 3 Cognitive Overload Files (Files with highest mental strain)
    const scoredFiles: HighStrainFile[] = repo.files.map((file) => {
      const inDeg = file.dependents.length;
      const outDeg = file.dependencies.length;
      const lines = file.linesCount;
      const symCount = file.symbols.length;

      const strain =
        outDeg * 12 +
        inDeg * 15 +
        Math.min(40, lines * 0.4) +
        symCount * 6;

      let reason = 'High dependency density requiring coordination across multiple layers.';
      if (inDeg >= 3 && outDeg >= 2) {
        reason = `Architectural hub: imports ${outDeg} dependencies and is simultaneously consumed by ${inDeg} upstream modules.`;
      } else if (inDeg >= 3) {
        reason = `High afferent coupling (${inDeg} callers): changes ripple broadly across the system.`;
      } else if (outDeg >= 3) {
        reason = `High fan-out (${outDeg} imports): requires tracking multiple external contracts simultaneously.`;
      }

      return {
        file,
        strainScore: Math.round(strain),
        reason,
        complexityCategory: strain >= 50 ? 'HIGH' : 'MEDIUM',
      };
    });

    scoredFiles.sort((a, b) => b.strainScore - a.strainScore);

    return {
      overallScore,
      tier,
      tierLabel,
      tierDescription,
      tierColor,
      tierBg,
      ringColor,
      estimatedOnboarding,
      dependencyDensityScore,
      fileComplexityScore,
      couplingStrainScore,
      contextSwitchingScore,
      topOverloadFiles: scoredFiles.slice(0, 3),
    };
  }, [repo]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-5">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Brain className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Repository Cognitive Load Index
            </h2>
            <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[9px] font-mono font-bold text-indigo-400 border border-indigo-500/20">
              AST + GRAPH DENSITY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quantifies the mental working memory required for a developer to understand and safely modify this codebase.
          </p>
        </div>

        {/* Onboarding Velocity Badge */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 font-mono text-xs text-slate-300">
          <Clock className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-slate-400 text-[11px]">Ramp-up Velocity:</span>
          <span className="font-bold text-indigo-300">
            {cognitiveMetrics.estimatedOnboarding}
          </span>
        </div>
      </div>

      {/* Main Grid: Score Radial & Dimension Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left: Overall Score Circle Card */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800/90 bg-slate-950/80 p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-purple-500/5 to-transparent pointer-events-none" />

          {/* SVG Circular Progress Meter */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#1e293b"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={cognitiveMetrics.ringColor}
                strokeWidth="8"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * cognitiveMetrics.overallScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black font-mono text-white tracking-tight">
                <AnimatedNumber value={cognitiveMetrics.overallScore} />
              </span>
              <span className="text-[10px] font-mono uppercase text-slate-400 -mt-0.5">
                / 100 SCORE
              </span>
            </div>
          </div>

          <div className="mt-3">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-mono font-bold uppercase border ${cognitiveMetrics.tierBg} ${cognitiveMetrics.tierColor}`}
            >
              {cognitiveMetrics.tierLabel}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed font-sans max-w-xs">
            {cognitiveMetrics.tierDescription}
          </p>
        </div>

        {/* Right: 4 Analytical Dimension Gauges */}
        <div className="lg:col-span-8 space-y-3.5">
          {/* Dimension 1: Dependency Density */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span className="font-bold text-slate-200">
                  Dependency Density & Interconnection
                </span>
              </div>
              <span className="text-slate-400 font-bold">
                {cognitiveMetrics.dependencyDensityScore}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${cognitiveMetrics.dependencyDensityScore}%` }}
                className="h-full bg-cyan-400 transition-all duration-700"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>{graph.edges.length} graph edges across {repo.files.length} modules</span>
              <span>Fan-out complexity</span>
            </div>
          </div>

          {/* Dimension 2: File & Symbol Complexity */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                <span className="font-bold text-slate-200">
                  Code & Symbol Density
                </span>
              </div>
              <span className="text-slate-400 font-bold">
                {cognitiveMetrics.fileComplexityScore}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${cognitiveMetrics.fileComplexityScore}%` }}
                className="h-full bg-indigo-400 transition-all duration-700"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>
                {repo.files.reduce((a, b) => a + b.linesCount, 0)} total lines • {repo.files.reduce((a, b) => a + b.symbols.length, 0)} declared symbols
              </span>
              <span>Symbol retention load</span>
            </div>
          </div>

          {/* Dimension 3: Blast Radius Anxiety */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="font-bold text-slate-200">
                  Blast Radius Modification Anxiety
                </span>
              </div>
              <span className="text-slate-400 font-bold">
                {cognitiveMetrics.couplingStrainScore}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${cognitiveMetrics.couplingStrainScore}%` }}
                className="h-full bg-amber-400 transition-all duration-700"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>
                {graph.couplingHotspots.length} high-coupling hubs (Ca ≥ 3)
              </span>
              <span>Regression penalty</span>
            </div>
          </div>

          {/* Dimension 4: Context Switching Cost */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-400" />
                <span className="font-bold text-slate-200">
                  Context Switching Overhead
                </span>
              </div>
              <span className="text-slate-400 font-bold">
                {cognitiveMetrics.contextSwitchingScore}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${cognitiveMetrics.contextSwitchingScore}%` }}
                className="h-full bg-purple-400 transition-all duration-700"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Cross-boundary navigation distance</span>
              <span>Mental hop count</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Top 3 Cognitive Overload Files */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>TOP 3 COGNITIVE OVERLOAD HOTSPOTS (HIGHEST MENTAL STRAIN)</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Ranked by structural fan-in/fan-out & symbol density
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {cognitiveMetrics.topOverloadFiles.map((item, idx) => (
            <div
              key={item.file.path}
              className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 flex flex-col justify-between space-y-2.5 hover:border-slate-700 transition group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold font-mono text-slate-300">
                    #{idx + 1}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase border ${
                      item.complexityCategory === 'HIGH'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    Strain: {item.strainScore}
                  </span>
                </div>

                <div className="mt-1.5">
                  <div className="text-xs font-mono font-bold text-slate-200 truncate group-hover:text-indigo-400 transition">
                    {item.file.path.split('/').pop()}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate">
                    {item.file.path}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-1.5 leading-snug font-sans">
                  {item.reason}
                </p>

                <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-slate-500">
                  <span>Lines: {item.file.linesCount}</span>
                  <span>•</span>
                  <span>In: {item.file.dependents.length}</span>
                  <span>•</span>
                  <span>Out: {item.file.dependencies.length}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-900 font-mono text-[11px]">
                <button
                  onClick={() => onAnalyzeFileImpact(item.file.path)}
                  className="flex-1 rounded bg-amber-950/50 border border-amber-800/40 py-1 text-center text-amber-300 hover:bg-amber-900/60 transition"
                  title="Analyze blast radius if this file is modified"
                >
                  Impact
                </button>
                <button
                  onClick={() => onNavigateToCode(item.file.path)}
                  className="flex-1 rounded bg-slate-800/80 border border-slate-700/60 py-1 text-center text-slate-300 hover:bg-slate-700 transition"
                  title="Inspect source code"
                >
                  Inspect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
