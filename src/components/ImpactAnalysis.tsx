import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  GitBranch,
  ShieldAlert,
  FileCode,
  Layers,
  Code2,
  CheckCircle,
  ExternalLink,
  Search,
  Zap,
} from 'lucide-react';
import { RepositoryModel } from '../types/atlas';
import { calculateDependencyImpact } from '../engine/analyzer';

interface ImpactAnalysisProps {
  repo: RepositoryModel;
  initialFile?: string;
  onNavigateToCode: (filePath: string, line?: number) => void;
  onTargetFileChange?: (filePath: string) => void;
}

export const ImpactAnalysis: React.FC<ImpactAnalysisProps> = ({
  repo,
  initialFile,
  onNavigateToCode,
  onTargetFileChange,
}) => {
  // Find default file: prefer AuthService or first file in repo
  const defaultFile = useMemo(() => {
    if (initialFile && repo.fileMap[initialFile]) return initialFile;
    const authFile = repo.files.find(f => f.path.includes('AuthService') || f.path.includes('auth'));
    return authFile ? authFile.path : repo.files[0]?.path || '';
  }, [repo, initialFile]);

  const [selectedFilePath, setSelectedFilePath] = useState<string>(defaultFile);
  const [activeTab, setActiveTab] = useState<'subsystems' | 'direct' | 'indirect' | 'evidence'>('subsystems');
  const [fileFilter, setFileFilter] = useState('');

  React.useEffect(() => {
    if (initialFile && repo.fileMap[initialFile]) {
      setSelectedFilePath(initialFile);
    } else if (!repo.fileMap[selectedFilePath] && repo.files.length > 0) {
      setSelectedFilePath(repo.files[0].path);
    }
  }, [repo.id, initialFile]);

  // Calculate deterministic dependency impact
  const impactResult = useMemo(() => {
    if (!selectedFilePath || !repo.fileMap[selectedFilePath]) return null;
    return calculateDependencyImpact(selectedFilePath, repo.graph, repo.fileMap);
  }, [selectedFilePath, repo]);

  const selectedFile = selectedFilePath ? repo.fileMap[selectedFilePath] : null;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Title & Selector Header */}
      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30">
                SIGNATURE CAPABILITY
              </span>
              <span className="text-xs font-mono text-slate-400">
                Deterministic Blast Radius Engine
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-mono flex items-center gap-2.5">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
              What Breaks If I Change This?
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Select any file or symbol to compute the cascading blast radius, direct callers, transitive dependents, and code evidence.
            </p>
          </div>

          {/* File Selector Dropdown */}
          <div className="flex flex-col gap-1.5 w-full md:w-80">
            <label className="text-[11px] font-mono uppercase text-slate-400">
              Select Target Component:
            </label>
            <select
              value={selectedFilePath}
              onChange={(e) => {
                setSelectedFilePath(e.target.value);
                onTargetFileChange?.(e.target.value);
              }}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-slate-200 focus:border-amber-500 focus:outline-none"
            >
              {repo.files.length === 0 ? (
                <option value="">No files in workspace (Fresh Start)</option>
              ) : (
                repo.files.map((file) => (
                  <option key={file.path} value={file.path}>
                    {file.path} ({file.moduleCluster})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Selected Target Stats bar */}
        {impactResult && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500">Target Module</div>
              <div className="text-xs font-bold font-mono text-amber-400 truncate mt-0.5">
                {impactResult.targetFileName}
              </div>
              <div className="text-[10px] text-slate-400">{impactResult.cluster}</div>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500">Direct Callers</div>
              <div className="text-xs font-bold font-mono text-white mt-0.5">
                {impactResult.directDependents.length} files
              </div>
              <div className="text-[10px] text-slate-400">Directly import target</div>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500">Transitive Blast Radius</div>
              <div className="text-xs font-bold font-mono text-rose-400 mt-0.5">
                {impactResult.indirectDependents.length} indirect files
              </div>
              <div className="text-[10px] text-slate-400">Deep dependency tree</div>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500">Total Blast Impact</div>
              <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5 flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-amber-400" />
                Score: {impactResult.totalBlastRadius}
              </div>
              <div className="text-[10px] text-slate-400">Weighted cascade index</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Analysis View */}
      {impactResult ? (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 gap-4 text-xs font-mono">
            <button
              onClick={() => setActiveTab('subsystems')}
              className={`pb-2.5 font-semibold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'subsystems'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Subsystem Impact ({impactResult.subsystemImpacts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('direct')}
              className={`pb-2.5 font-semibold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'direct'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span>Direct Dependents ({impactResult.directDependents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('indirect')}
              className={`pb-2.5 font-semibold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'indirect'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Indirect / Cascading ({impactResult.indirectDependents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('evidence')}
              className={`pb-2.5 font-semibold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'evidence'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Code Evidence ({impactResult.evidence.length})</span>
            </button>
          </div>

          {/* TAB 1: Subsystem Impact Bars (PRD Specification) */}
          {activeTab === 'subsystems' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Potential Impact by Architectural Layer
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quantified risk level based on caller count, coupling centrality, and abstraction layer.
                </p>
              </div>

              <div className="space-y-4">
                {impactResult.subsystemImpacts.map((sub) => {
                  const barColor =
                    sub.level === 'HIGH'
                      ? 'bg-rose-500'
                      : sub.level === 'MEDIUM'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400';
                  const badgeColor =
                    sub.level === 'HIGH'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : sub.level === 'MEDIUM'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

                  return (
                    <div key={sub.name} className="space-y-1.5 bg-slate-950/40 p-3.5 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200 font-mono">
                            {sub.name}
                          </span>
                          <span className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase border ${badgeColor}`}>
                            {sub.level} IMPACT
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          {sub.score}% Risk Index
                        </span>
                      </div>

                      {/* Bar Visualization */}
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${sub.score}%` }}
                          className={`h-full ${barColor} transition-all duration-500`}
                        />
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>{sub.reason}</span>
                        <span className="font-mono text-slate-500">
                          {sub.affectedFilesCount} affected file{sub.affectedFilesCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Direct Dependents */}
          {activeTab === 'direct' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Direct Upstream Dependents (Will Break Immediately)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  These components directly import or call <code className="text-amber-400">{impactResult.targetFileName}</code>. Modifying method signatures or export types will cause immediate compilation or runtime failure.
                </p>
              </div>

              {impactResult.directDependents.length === 0 ? (
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-500">
                  No direct callers found. This file is a top-level application root or unused component.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {impactResult.directDependents.map((dep) => (
                    <div
                      key={dep.filePath}
                      className="rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 hover:border-slate-700 transition flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-amber-400 shrink-0" />
                          <span className="text-xs font-mono font-bold text-slate-200">
                            {dep.name}
                          </span>
                          <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] font-mono text-slate-400">
                            {dep.cluster}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {dep.reason}
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigateToCode(dep.filePath, dep.line)}
                        className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-300 hover:bg-indigo-600 hover:text-white transition"
                      >
                        <span>Inspect Line {dep.line}</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Indirect Transitive Blast Radius */}
          {activeTab === 'indirect' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Indirect / Transitive Blast Radius (Cascading Ripple Effect)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Components that do not directly import {impactResult.targetFileName}, but rely on intermediaries that do.
                </p>
              </div>

              {impactResult.indirectDependents.length === 0 ? (
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-500">
                  No secondary cascading dependents found. Blast radius is tightly contained!
                </div>
              ) : (
                <div className="space-y-3">
                  {impactResult.indirectDependents.map((dep, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-rose-400" />
                          <span className="text-xs font-mono font-bold text-slate-200">
                            {dep.name}
                          </span>
                          <span className="rounded bg-rose-950/40 text-rose-300 border border-rose-900/40 px-1.5 py-0.2 text-[9px] font-mono">
                            Depth {dep.depth}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {dep.cluster}
                          </span>
                        </div>
                        <button
                          onClick={() => onNavigateToCode(dep.filePath)}
                          className="text-[11px] font-mono text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <span>Open File</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Path Traversed Chain */}
                      {dep.pathTraversed && (
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded">
                          <span className="text-slate-500">Propagation:</span>
                          {dep.pathTraversed.map((p, pIdx) => (
                            <React.Fragment key={p}>
                              <span className={pIdx === dep.pathTraversed!.length - 1 ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
                                {p.split('/').pop()}
                              </span>
                              {pIdx < dep.pathTraversed!.length - 1 && (
                                <span className="text-slate-600">➔</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Code Evidence Lines */}
          {activeTab === 'evidence' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Verifiable Codebase Evidence
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ATLAS never conjectures without code evidence. Every impact claim connects to concrete source lines.
                </p>
              </div>

              <div className="space-y-3">
                {impactResult.evidence.map((ev, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {ev.file} : Line {ev.line}
                        </span>
                      </div>
                      <button
                        onClick={() => onNavigateToCode(ev.file, ev.line)}
                        className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <span>Jump to Code</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>

                    <pre className="rounded bg-slate-900 p-2 text-xs font-mono text-amber-300 overflow-x-auto border border-slate-800">
                      <code>{ev.statement}</code>
                    </pre>

                    <div className="text-[11px] text-slate-400">
                      {ev.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center space-y-4 animate-fade-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white font-mono">No Target Component Selected (Fresh Start)</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              This workspace is currently empty with 0 files. Ingest a GitHub repository or load demonstration projects to compute dependency blast radii.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
