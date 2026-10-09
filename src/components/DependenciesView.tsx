import React, { useState } from 'react';
import {
  GitFork,
  ArrowRight,
  Flame,
  AlertCircle,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { RepositoryModel } from '../types/atlas';
import { AnimatedNumber } from '../hooks/useAnimatedNumber';

interface DependenciesViewProps {
  repo: RepositoryModel;
  onAnalyzeFileImpact: (filePath: string) => void;
  onNavigateToCode: (filePath: string) => void;
}

export const DependenciesView: React.FC<DependenciesViewProps> = ({
  repo,
  onAnalyzeFileImpact,
  onNavigateToCode,
}) => {
  const { graph } = repo;
  const [filterQuery, setFilterQuery] = useState('');

  const filteredNodes = graph.nodes.filter(
    (n) =>
      n.label.toLowerCase().includes(filterQuery.toLowerCase()) ||
      n.filePath.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-400 border border-indigo-500/30">
            SYSTEM METRICS
          </span>
          <span className="text-xs font-mono text-slate-400">
            Coupling Matrix & Dependency Hotspots
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white font-mono flex items-center gap-2.5">
          <GitFork className="h-6 w-6 text-indigo-400" />
          Module Coupling & Dependencies
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
          Measure Afferent Coupling (Ca: who relies on a module), Efferent Coupling (Ce: what a module imports), and Robert C. Martin's Instability Metric (I = Ce / (Ca + Ce)).
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 font-mono ui-card-interactive">
          <div className="text-[10px] text-slate-500">Total Relationships</div>
          <div className="mt-1 text-2xl font-bold text-white">
            <AnimatedNumber value={graph.edges.length} />
          </div>
          <div className="text-[10px] text-slate-400">Direct static edges</div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 font-mono ui-card-interactive">
          <div className="text-[10px] text-slate-500">Coupling Hotspots</div>
          <div className="mt-1 text-2xl font-bold text-amber-400">
            <AnimatedNumber value={graph.couplingHotspots.length} />
          </div>
          <div className="text-[10px] text-slate-400">Ca ≥ 3 callers</div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 font-mono ui-card-interactive">
          <div className="text-[10px] text-slate-500">Circular Dependencies</div>
          <div className={`mt-1 text-2xl font-bold ${graph.circularDependencies.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            <AnimatedNumber value={graph.circularDependencies.length} />
          </div>
          <div className="text-[10px] text-slate-400">Cycle violations</div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 font-mono ui-card-interactive">
          <div className="text-[10px] text-slate-500">Average Instability</div>
          <div className="mt-1 text-2xl font-bold text-indigo-400">
            {graph.nodes.length === 0 ? '0.00' : (graph.nodes.reduce((a, b) => a + b.metrics.instability, 0) / graph.nodes.length).toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400">0 (Stable) to 1 (Volatile)</div>
        </div>
      </div>

      {/* Coupling Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            All Modules Coupling Ratios
          </h2>

          <input
            type="text"
            placeholder="Filter files..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full sm:w-64 rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                <th className="pb-2.5 font-semibold">File / Module</th>
                <th className="pb-2.5 font-semibold">Subsystem</th>
                <th className="pb-2.5 font-semibold">Afferent (Ca)</th>
                <th className="pb-2.5 font-semibold">Efferent (Ce)</th>
                <th className="pb-2.5 font-semibold">Instability (I)</th>
                <th className="pb-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredNodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono text-xs">
                    No module relationships found. Ingest a repository to populate coupling metrics.
                  </td>
                </tr>
              ) : (
                filteredNodes.map((node) => (
                  <tr key={node.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 pr-3">
                    <button
                      onClick={() => onNavigateToCode(node.filePath)}
                      className="font-bold text-slate-200 hover:text-indigo-400 text-left truncate max-w-xs block"
                    >
                      {node.filePath}
                    </button>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-400">
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px]">
                      {node.cluster}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className={node.metrics.inDegree >= 3 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                      {node.metrics.inDegree} callers
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-300">
                    {node.metrics.outDegree} imports
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${node.metrics.instability * 100}%` }}
                          className={`h-full ${
                            node.metrics.instability > 0.7
                              ? 'bg-cyan-400'
                              : node.metrics.instability < 0.3
                              ? 'bg-rose-400'
                              : 'bg-indigo-400'
                          }`}
                        />
                      </div>
                      <span className="text-slate-400 text-[10px]">
                        {node.metrics.instability}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right space-x-2">
                    <button
                      onClick={() => onAnalyzeFileImpact(node.filePath)}
                      className="rounded bg-slate-800 px-2 py-1 text-[11px] text-amber-300 hover:bg-amber-600 hover:text-white transition"
                    >
                      Impact
                    </button>
                    <button
                      onClick={() => onNavigateToCode(node.filePath)}
                      className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700 transition"
                    >
                      View
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
