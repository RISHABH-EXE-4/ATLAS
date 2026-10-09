import React, { useState, useMemo } from 'react';
import {
  Compass,
  Zap,
  ArrowRight,
  MousePointerClick,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { RepositoryModel, GraphNode, ModuleCluster } from '../types/atlas';

interface ArchitecturePreviewWidgetProps {
  repo: RepositoryModel;
  onAnalyzeFileImpact: (filePath: string) => void;
  onNavigateToCode: (filePath: string) => void;
}

interface VisualNode {
  id: string;
  filePath: string;
  label: string;
  cluster: ModuleCluster;
  tier: number;
  x: number;
  y: number;
  inDegree: number;
  outDegree: number;
  isHotspot: boolean;
}

interface VisualEdge {
  id: string;
  source: string;
  target: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const ArchitecturePreviewWidget: React.FC<ArchitecturePreviewWidgetProps> = ({
  repo,
  onAnalyzeFileImpact,
  onNavigateToCode,
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Derive key architectural nodes from the repository graph
  const { visualNodes, visualEdges } = useMemo(() => {
    const tierClusters: ModuleCluster[][] = [
      ['Frontend'],
      ['API Layer'],
      ['Auth & Security', 'Services'],
      ['Database', 'Configuration', 'Utilities'],
    ];

    const canvasWidth = 840;
    const canvasHeight = 320;
    const tierY = [45, 125, 205, 280];

    const nodes: VisualNode[] = [];
    const nodeMap: Record<string, VisualNode> = {};

    tierClusters.forEach((clustersInTier, tierIdx) => {
      // Find prominent files in this tier
      const candidateFiles = repo.files.filter((f) =>
        clustersInTier.includes(f.moduleCluster)
      );

      // Pick top 2-3 prominent files per tier
      const selectedForTier = candidateFiles
        .sort((a, b) => b.dependents.length + b.dependencies.length - (a.dependents.length + a.dependencies.length))
        .slice(0, 3);

      const count = selectedForTier.length;
      if (count === 0) return;

      const spacing = canvasWidth / (count + 1);

      selectedForTier.forEach((file, idx) => {
        const x = Math.round(spacing * (idx + 1));
        const y = tierY[tierIdx];
        const isHotspot = file.dependents.length >= 2;

        const vNode: VisualNode = {
          id: file.path,
          filePath: file.path,
          label: file.name,
          cluster: file.moduleCluster,
          tier: tierIdx,
          x,
          y,
          inDegree: file.dependents.length,
          outDegree: file.dependencies.length,
          isHotspot,
        };

        nodes.push(vNode);
        nodeMap[file.path] = vNode;
      });
    });

    // If still too few nodes, grab top files from repo
    if (nodes.length < 4) {
      repo.files.slice(0, 6).forEach((f, idx) => {
        if (!nodeMap[f.path]) {
          const tierIdx = idx % 4;
          const vNode: VisualNode = {
            id: f.path,
            filePath: f.path,
            label: f.name,
            cluster: f.moduleCluster,
            tier: tierIdx,
            x: Math.round(140 + (idx % 3) * 260),
            y: tierY[tierIdx],
            inDegree: f.dependents.length,
            outDegree: f.dependencies.length,
            isHotspot: f.dependents.length >= 2,
          };
          nodes.push(vNode);
          nodeMap[f.path] = vNode;
        }
      });
    }

    // Generate edges between existing nodes
    const edges: VisualEdge[] = [];
    const seenVisualEdgeIds = new Set<string>();

    nodes.forEach((srcNode) => {
      const srcFile = repo.fileMap[srcNode.filePath];
      if (!srcFile) return;

      srcFile.dependencies.forEach((targetPath) => {
        const targetNode = nodeMap[targetPath];
        if (targetNode && targetNode.id !== srcNode.id) {
          const edgeId = `${srcNode.id}->${targetNode.id}`;
          if (!seenVisualEdgeIds.has(edgeId)) {
            seenVisualEdgeIds.add(edgeId);
            edges.push({
              id: edgeId,
              source: srcNode.id,
              target: targetNode.id,
              x1: srcNode.x,
              y1: srcNode.y,
              x2: targetNode.x,
              y2: targetNode.y,
            });
          }
        }
      });
    });

    // Fallback edges if none found
    if (edges.length === 0 && nodes.length >= 2) {
      for (let i = 0; i < nodes.length - 1; i++) {
        if (nodes[i].tier !== nodes[i + 1].tier) {
          edges.push({
            id: `fb-${nodes[i].id}->${nodes[i + 1].id}`,
            source: nodes[i].id,
            target: nodes[i + 1].id,
            x1: nodes[i].x,
            y1: nodes[i].y,
            x2: nodes[i + 1].x,
            y2: nodes[i + 1].y,
          });
        }
      }
    }

    return { visualNodes: nodes, visualEdges: edges };
  }, [repo]);

  const hoveredNode = hoveredNodeId
    ? visualNodes.find((n) => n.id === hoveredNodeId)
    : null;

  return (
    <div className="rounded-[2rem] border border-[#232635] bg-[#14151e] p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232635] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Compass className="h-4 w-4" />
            </div>
            <h2
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-base sm:text-lg font-bold text-white tracking-wide uppercase"
            >
              Interactive Architecture Topology
            </h2>
            <span className="rounded-full bg-[#d4ff59]/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#d4ff59] border border-[#d4ff59]/30">
              CLICK NODE ➔ IMPACT ANALYSIS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Click any core module node to instantly jump to its cascading dependency blast radius analysis.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <MousePointerClick className="h-4 w-4 text-[#d4ff59] animate-bounce" />
          <span className="hidden sm:inline">Interactive SVG Canvas</span>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div className="relative w-full h-80 sm:h-96 rounded-2xl bg-[#0c0d13] border border-[#1e202d] overflow-hidden group">
        {visualNodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 animate-fade-in">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 animate-pulse">
              <Layers className="h-6 w-6" />
            </div>
            <div className="text-sm font-bold text-white font-mono">Fresh Architectural Canvas (0 Modules)</div>
            <p className="text-xs text-slate-400 max-w-sm">
              All architectural tiers are at zero baseline. Ingest a GitHub repository or load a sample codebase to map subsystem topologies.
            </p>
          </div>
        ) : (
          <svg
            viewBox="0 0 840 330"
            className="w-full h-full select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
          <defs>
            {/* Arrowhead marker */}
            <marker
              id="arch-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#8b5cf6" />
            </marker>
            <marker
              id="arch-arrow-hover"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--theme-accent, #d4ff59)" />
            </marker>

            {/* Glowing filter */}
            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="var(--theme-accent, #d4ff59)" floodOpacity="0.6" />
            </filter>
            <filter id="purple-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#a855f7" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Tier Background Guidelines */}
          {['FRONTEND LAYER', 'API & ROUTING LAYER', 'CORE SERVICES & AUTH HUB', 'DATABASE & STORAGE LAYER'].map(
            (label, idx) => {
              const y = 45 + idx * 78;
              return (
                <g key={label}>
                  <line
                    x1="20"
                    y1={y}
                    x2="820"
                    y2={y}
                    stroke="#1a1d29"
                    strokeDasharray="4 6"
                    strokeWidth="1"
                  />
                  <text
                    x="25"
                    y={y - 18}
                    fill="#475569"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    letterSpacing="0.08em"
                  >
                    {label}
                  </text>
                </g>
              );
            }
          )}

          {/* Render Flow Edges */}
          {visualEdges.map((edge, edgeIndex) => {
            const isConnectedToHover =
              hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId);

            // Calculate bezier curve
            const midY = (edge.y1 + edge.y2) / 2;
            const pathData = `M ${edge.x1} ${edge.y1 + 18} C ${edge.x1} ${midY}, ${edge.x2} ${midY}, ${edge.x2} ${edge.y2 - 18}`;

            return (
              <g key={`${edge.id}-${edgeIndex}`}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={isConnectedToHover ? 'var(--theme-accent, #d4ff59)' : '#33384f'}
                  strokeWidth={isConnectedToHover ? 2.5 : 1.2}
                  strokeDasharray={isConnectedToHover ? undefined : '3 3'}
                  markerEnd={isConnectedToHover ? 'url(#arch-arrow-hover)' : 'url(#arch-arrow)'}
                  className="transition-colors duration-300"
                />
              </g>
            );
          })}

          {/* Render Interactive Nodes */}
          {visualNodes.map((node) => {
            const isHovered = hoveredNodeId === node.id;
            const width = 160;
            const height = 40;
            const rectX = node.x - width / 2;
            const rectY = node.y - height / 2;

            return (
              <g
                key={node.id}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => onAnalyzeFileImpact(node.filePath)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
              >
                {/* Node Box */}
                <rect
                  x={rectX}
                  y={rectY}
                  width={width}
                  height={height}
                  rx="12"
                  fill={isHovered ? '#1a1d2c' : '#141622'}
                  stroke={
                    isHovered
                      ? 'var(--theme-accent, #d4ff59)'
                      : node.isHotspot
                      ? '#f59e0b'
                      : '#2a2e42'
                  }
                  strokeWidth={isHovered ? 2.2 : 1.2}
                  filter={isHovered ? 'url(#neon-glow)' : node.isHotspot ? 'url(#purple-glow)' : undefined}
                />

                {/* Left status indicator dot */}
                <circle
                  cx={rectX + 16}
                  cy={node.y}
                  r="4"
                  fill={
                    isHovered
                      ? 'var(--theme-accent, #d4ff59)'
                      : node.isHotspot
                      ? '#f59e0b'
                      : '#8b5cf6'
                  }
                />

                {/* Node Label Text */}
                <text
                  x={rectX + 28}
                  y={node.y - 2}
                  fill={isHovered ? '#ffffff' : '#f1f5f9'}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {node.label.length > 14 ? `${node.label.slice(0, 13)}…` : node.label}
                </text>

                {/* Subtitle / Callers badge */}
                <text
                  x={rectX + 28}
                  y={node.y + 11}
                  fill={isHovered ? 'var(--theme-accent, #d4ff59)' : '#64748b'}
                  fontSize="8.5"
                  fontFamily="monospace"
                >
                  {node.cluster} • In:{node.inDegree} Out:{node.outDegree}
                </text>

                {/* Jump arrow indicator */}
                <g transform={`translate(${rectX + width - 20}, ${node.y - 6})`}>
                  <polygon
                    points="0,0 8,6 0,12"
                    fill={isHovered ? 'var(--theme-accent, #d4ff59)' : '#475569'}
                  />
                </g>
              </g>
            );
          })}
        </svg>
        )}

        {/* Hover Action Floating HUD */}
        {hoveredNode && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-80 rounded-xl border border-[#2a2e42] bg-[#14151e]/95 p-3 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs font-mono animate-fadeIn z-20">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#d4ff59] font-bold">⚡ Ready to Analyze:</span>
                <span className="text-white font-bold truncate max-w-[140px]">
                  {hoveredNode.label}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {hoveredNode.inDegree} direct callers • {hoveredNode.outDegree} imports
              </div>
            </div>

            <button
              onClick={() => onAnalyzeFileImpact(hoveredNode.filePath)}
              className="flex items-center gap-1 rounded-full bg-[#d4ff59] px-3 py-1 text-xs font-bold text-black shadow-md shadow-[#d4ff59]/20 hover:scale-105 transition shrink-0"
            >
              <span>Jump</span>
              <ArrowRight className="h-3 w-3 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Quick Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 pt-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#d4ff59]" />
            <span>Interactive Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
            <span>High Coupling Hotspot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
            <span>Standard Module</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-500">
          Clicking any node navigates immediately to its impact blast radius.
        </span>
      </div>
    </div>
  );
};
