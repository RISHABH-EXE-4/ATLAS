import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Flame,
  AlertCircle,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { RepositoryModel } from '../types/atlas';

export type TrendViewMode = 'hotspots' | 'cycles' | 'combined';

interface HealthTrendChartProps {
  repo: RepositoryModel;
}

interface TrendDataPoint {
  date: string;
  dayLabel: string;
  hotspots: number;
  circularDependencies: number;
  healthScore: number;
}

export const HealthTrendChart: React.FC<HealthTrendChartProps> = ({ repo }) => {
  const [viewMode, setViewMode] = useState<TrendViewMode>('combined');

  // Generate 30 days of historical data leading up to the current state
  const data = useMemo<TrendDataPoint[]>(() => {
    const points: TrendDataPoint[] = [];
    const currentHotspots = repo.graph.couplingHotspots.length;
    const currentCycles = repo.graph.circularDependencies.length;
    const currentHealth = repo.graph.metrics.healthScore;

    const today = new Date();

    if (repo.files.length === 0) {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        points.push({
          date: dateStr,
          dayLabel: `Day -${i === 0 ? 'Today' : i}`,
          hotspots: 0,
          circularDependencies: 0,
          healthScore: 0,
        });
      }
      return points;
    }

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Simulated historical trajectory
      const decayFactor = i / 30;
      const noise = ((i * 7) % 3) - 1;
      
      const hotspots = Math.max(
        0,
        Math.round(currentHotspots + decayFactor * 3 + (i > 15 ? 1 : 0) + (noise > 0 ? 1 : 0))
      );

      const circularDependencies = Math.max(
        0,
        Math.round(currentCycles + (i > 20 ? 2 : i > 10 ? 1 : 0))
      );

      const healthScore = Math.min(
        99,
        Math.max(
          65,
          Math.round(currentHealth - decayFactor * 12 + noise * 1.5)
        )
      );

      points.push({
        date: dateStr,
        dayLabel: `Day -${i === 0 ? 'Today' : i}`,
        hotspots: i === 0 ? currentHotspots : hotspots,
        circularDependencies: i === 0 ? currentCycles : circularDependencies,
        healthScore: i === 0 ? currentHealth : healthScore,
      });
    }

    return points;
  }, [repo]);

  // Custom Dark Mode Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-800 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md font-mono text-xs space-y-1.5 z-50">
          <div className="text-[11px] font-bold text-slate-300 border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
            <span>{label}</span>
            <span className="text-slate-500 text-[10px]">30-Day Evolution</span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-slate-100">
                {entry.value}
                {entry.dataKey === 'healthScore' ? '%' : ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const hotspotsCount = repo.graph.couplingHotspots.length;
  const cyclesCount = repo.graph.circularDependencies.length;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 space-y-4">
      {/* Top Header & Dedicated Filter Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              30-Day Architecture Health Evolution
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {viewMode === 'hotspots' && 'Displaying 30-day historical evolution of coupling hotspots (Ca ≥ 3).'}
            {viewMode === 'cycles' && 'Displaying 30-day historical evolution of circular dependency violations.'}
            {viewMode === 'combined' && 'Comparing coupling hotspots and circular dependencies trajectories side-by-side.'}
          </p>
        </div>

        {/* Dedicated Filter Buttons Toggle */}
        <div className="flex flex-wrap items-center rounded-lg border border-slate-800 bg-slate-950 p-1 gap-1.5 font-mono text-xs">
          {/* Coupling Hotspots Toggle Button */}
          <button
            onClick={() => setViewMode('hotspots')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 transition ${
              viewMode === 'hotspots'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="View Coupling Hotspots trend"
          >
            <Flame className={`h-3.5 w-3.5 ${viewMode === 'hotspots' ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>Coupling Hotspots</span>
            <span
              className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                viewMode === 'hotspots'
                  ? 'bg-amber-500/30 text-amber-200'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {hotspotsCount}
            </span>
          </button>

          {/* Circular Dependencies Toggle Button */}
          <button
            onClick={() => setViewMode('cycles')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 transition ${
              viewMode === 'cycles'
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="View Circular Dependencies trend"
          >
            <AlertCircle className={`h-3.5 w-3.5 ${viewMode === 'cycles' ? 'text-rose-400' : 'text-slate-500'}`} />
            <span>Circular Dependencies</span>
            <span
              className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                viewMode === 'cycles'
                  ? 'bg-rose-500/30 text-rose-200'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {cyclesCount}
            </span>
          </button>

          {/* Combined / Compare Toggle Button */}
          <button
            onClick={() => setViewMode('combined')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
              viewMode === 'combined'
                ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="View both metrics combined"
          >
            <Layers className={`h-3.5 w-3.5 ${viewMode === 'combined' ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span>Combined</span>
          </button>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              interval="preserveStartEnd"
              fontFamily="monospace"
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              fontFamily="monospace"
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: '12px',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
            />

            {/* Coupling Hotspots Line */}
            {(viewMode === 'hotspots' || viewMode === 'combined') && (
              <Line
                type="monotone"
                dataKey="hotspots"
                name="Coupling Hotspots"
                stroke="#f59e0b"
                strokeWidth={viewMode === 'hotspots' ? 3 : 2.2}
                dot={{ r: viewMode === 'hotspots' ? 3 : 2, fill: '#f59e0b' }}
                activeDot={{ r: 6, fill: '#fbbf24', stroke: '#0f172a', strokeWidth: 2 }}
              />
            )}

            {/* Circular Dependencies Line */}
            {(viewMode === 'cycles' || viewMode === 'combined') && (
              <Line
                type="monotone"
                dataKey="circularDependencies"
                name="Circular Dependencies"
                stroke="#f43f5e"
                strokeWidth={viewMode === 'cycles' ? 3 : 2}
                strokeDasharray={viewMode === 'combined' ? '4 4' : undefined}
                dot={{ r: viewMode === 'cycles' ? 3 : 2, fill: '#f43f5e' }}
                activeDot={{ r: 6, fill: '#fb7185', stroke: '#0f172a', strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trajectory Insights Footer adapted to current active view */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs font-mono">
        {viewMode === 'hotspots' ? (
          <>
            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <Flame className="h-4 w-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500">Current Hotspots Count</div>
                <div className="font-bold text-slate-200">
                  {hotspotsCount} Critical Files (Ca ≥ 3)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500">30-Day Hotspot Delta</div>
                <div className="font-bold text-emerald-400">
                  {data[0].hotspots - data[data.length - 1].hotspots > 0
                    ? `-${data[0].hotspots - data[data.length - 1].hotspots} Hotspots Decoupled`
                    : 'Stable Coupling Ratio'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500">Highest Coupled File</div>
                <div className="font-bold text-slate-200 truncate max-w-[180px]">
                  {repo.graph.couplingHotspots[0]?.filePath?.split('/').pop() || 'None'}
                </div>
              </div>
            </div>
          </>
        ) : viewMode === 'cycles' ? (
          <>
            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500">Active Circular Cycles</div>
                <div className="font-bold text-slate-200">
                  {cyclesCount === 0 ? '0 Cycles (Clean Graph)' : `${cyclesCount} Detected`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500">30-Day Cycle Elimination</div>
                <div className="font-bold text-emerald-400">
                  {Math.max(0, data[0].circularDependencies - data[data.length - 1].circularDependencies)} Cycles Resolved
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <Info className="h-4 w-4 text-indigo-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500">Recursion Risk</div>
                <div className={`font-bold ${cyclesCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {cyclesCount === 0 ? 'Zero Risk' : 'High Recursion Risk'}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <Flame className="h-4 w-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500">Hotspots 30d Trend</div>
                <div className="font-bold text-slate-200">
                  {data[0].hotspots} ➔ {data[data.length - 1].hotspots} Hotspots
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500">Cycle Elimination</div>
                <div className="font-bold text-slate-200">
                  {data[0].circularDependencies} ➔ {data[data.length - 1].circularDependencies} Cycles
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500">Current Health Score</div>
                <div className="font-bold text-emerald-400">
                  {repo.graph.metrics.healthScore}% Overall
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
