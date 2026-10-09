import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Layers,
  ArrowRight,
  Code2,
  Box,
  AlertTriangle,
  FileCode,
  Filter,
  Download,
  Image as ImageIcon,
  Check,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { RepositoryModel, GraphNode, ModuleCluster } from '../types/atlas';

interface ArchitectureMapProps {
  repo: RepositoryModel;
  onNavigateToCode: (filePath: string) => void;
  onAnalyzeImpact: (filePath: string) => void;
  onAskAIAboutFile?: (filePath: string) => void;
}

export const ArchitectureMap: React.FC<ArchitectureMapProps> = ({
  repo,
  onNavigateToCode,
  onAnalyzeImpact,
  onAskAIAboutFile,
}) => {
  const { graph } = repo;

  // Zoom & Pan state
  const [scale, setScale] = useState(0.85);
  const [offset, setOffset] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Filters & selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<string>('all');
  const [relationFilter, setRelationFilter] = useState<'all' | 'imports' | 'calls'>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Cluster tier layout order
  const clusterOrder: ModuleCluster[] = [
    'Frontend',
    'API Layer',
    'Auth & Security',
    'Services',
    'Database',
    'Configuration',
    'Utilities',
  ];

  const clusterColors: Record<ModuleCluster, { bg: string; border: string; text: string; dot: string }> = {
    'Frontend': { bg: 'bg-cyan-950/40', border: 'border-cyan-500/40', text: 'text-cyan-400', dot: '#06b6d4' },
    'API Layer': { bg: 'bg-indigo-950/40', border: 'border-indigo-500/40', text: 'text-indigo-400', dot: '#6366f1' },
    'Auth & Security': { bg: 'bg-rose-950/40', border: 'border-rose-500/40', text: 'text-rose-400', dot: '#f43f5e' },
    'Services': { bg: 'bg-emerald-950/40', border: 'border-emerald-500/40', text: 'text-emerald-400', dot: '#10b981' },
    'Database': { bg: 'bg-amber-950/40', border: 'border-amber-500/40', text: 'text-amber-400', dot: '#f59e0b' },
    'Configuration': { bg: 'bg-purple-950/40', border: 'border-purple-500/40', text: 'text-purple-400', dot: '#a855f7' },
    'Utilities': { bg: 'bg-slate-900', border: 'border-slate-700', text: 'text-slate-400', dot: '#94a3b8' },
  };

  // Node position calculation
  // Lay nodes out in clean architectural tiers with multi-row grid wrapping
  const { layoutNodes, tierBands, totalWidth, totalHeight } = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const bands: Array<{ name: ModuleCluster; x: number; y: number; width: number; height: number; count: number }> = [];

    let currentY = 50;
    const maxCols = 4;
    const nodeWidth = 200;
    const nodeHeight = 60;
    const gapX = 30;
    const gapY = 24;

    clusterOrder.forEach((clusterName) => {
      const filesInCluster = (graph.clusters[clusterName] || []).filter(fp => graph.nodeMap[fp]);
      const totalInTier = filesInCluster.length;
      if (totalInTier === 0) return;

      const cols = Math.min(maxCols, Math.max(1, totalInTier));
      const rows = Math.ceil(totalInTier / cols);
      const tierContentWidth = cols * nodeWidth + (cols - 1) * gapX;
      const tierBandWidth = Math.max(980, tierContentWidth + 120);
      const tierBandHeight = rows * nodeHeight + (rows - 1) * gapY + 65;

      const bandX = 40;
      const bandY = currentY;

      bands.push({
        name: clusterName,
        x: bandX,
        y: bandY,
        width: tierBandWidth,
        height: tierBandHeight,
        count: totalInTier,
      });

      filesInCluster.forEach((filePath, nodeIndex) => {
        const col = nodeIndex % cols;
        const row = Math.floor(nodeIndex / cols);
        const nodeX = bandX + 35 + col * (nodeWidth + gapX);
        const nodeY = bandY + 45 + row * (nodeHeight + gapY);

        positions[filePath] = { x: nodeX, y: nodeY };
      });

      currentY += tierBandHeight + 40;
    });

    // Fallback: If any node wasn't in clusterOrder, assign it to currentY
    graph.nodes.forEach(node => {
      if (!positions[node.filePath]) {
        positions[node.filePath] = { x: 75, y: currentY };
        currentY += 80;
      }
    });

    const maxBandWidth = bands.reduce((max, b) => Math.max(max, b.width), 1000);

    return {
      layoutNodes: positions,
      tierBands: bands,
      totalWidth: maxBandWidth + 100,
      totalHeight: Math.max(600, currentY + 50),
    };
  }, [graph]);

  // Auto-fit view when repo or graph changes
  const fitView = () => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      if (clientWidth > 0 && clientHeight > 0 && totalWidth > 0 && totalHeight > 0) {
        const scaleX = (clientWidth - 60) / totalWidth;
        const scaleY = (clientHeight - 60) / totalHeight;
        const fitScale = Math.min(1.0, Math.max(0.25, Math.min(scaleX, scaleY)));
        const fitOffsetX = Math.max(20, (clientWidth - totalWidth * fitScale) / 2);
        const fitOffsetY = Math.max(20, (clientHeight - totalHeight * fitScale) / 2);
        setScale(fitScale);
        setOffset({ x: fitOffsetX, y: fitOffsetY });
        return;
      }
    }
    setScale(0.75);
    setOffset({ x: 40, y: 30 });
  };

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    fitView();

    const observer = new ResizeObserver(() => {
      fitView();
    });
    observer.observe(el);

    const timer = setTimeout(fitView, 60);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [repo.id, graph.nodes.length, totalWidth, totalHeight]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return graph.nodes.filter((node) => {
      const matchesSearch =
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.filePath.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCluster =
        selectedCluster === 'all' || node.cluster === selectedCluster;
      return matchesSearch && matchesCluster;
    });
  }, [graph.nodes, searchQuery, selectedCluster]);

  // Filtered edges
  const filteredEdges = useMemo(() => {
    return graph.edges.filter((edge) => {
      if (relationFilter !== 'all' && edge.type !== relationFilter) return false;
      return layoutNodes[edge.source] && layoutNodes[edge.target];
    });
  }, [graph.edges, relationFilter, layoutNodes]);

  // Highlighted connections when a node is selected or hovered
  const activeFocusNodeId = hoveredNodeId || selectedNodeId;
  const connectedNodeIds = useMemo(() => {
    if (!activeFocusNodeId) return new Set<string>();
    const set = new Set<string>([activeFocusNodeId]);
    (graph.adjacencyList[activeFocusNodeId] || []).forEach(t => set.add(t));
    (graph.reverseAdjacencyList[activeFocusNodeId] || []).forEach(s => set.add(s));
    return set;
  }, [activeFocusNodeId, graph]);

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setScale((s) => Math.min(2.5, Math.max(0.4, s * zoomFactor)));
  };

  const resetView = () => {
    setScale(0.9);
    setOffset({ x: 80, y: 40 });
  };

  // Export states & handlers
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<'svg' | 'png' | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generates clean standalone SVG document representing the complete architecture map
  const generateStandaloneSvgString = (): string => {
    const svgWidth = Math.max(1280, totalWidth + 120);
    const svgHeight = Math.max(760, totalHeight + 160);

    // Render tier bands
    const bandsSvg = tierBands
      .map(
        (band) => `
      <g id="band-${band.name.replace(/[^a-zA-Z0-9]/g, '_')}">
        <rect
          x="${band.x}"
          y="${band.y}"
          width="${band.width}"
          height="${band.height}"
          rx="14"
          fill="#0c111e"
          stroke="#202c42"
          stroke-width="1.2"
          stroke-dasharray="5 5"
        />
        <text
          x="${band.x + 20}"
          y="${band.y + 26}"
          fill="#94a3b8"
          font-size="12"
          font-weight="700"
          font-family="monospace"
          letter-spacing="0.06em"
        >
          ${band.name.toUpperCase()} TIER (${band.count} ${band.count === 1 ? 'module' : 'modules'})
        </text>
      </g>`
      )
      .join('\n');

    // Render edges
    const edgesSvg = filteredEdges
      .map((edge) => {
        const src = layoutNodes[edge.source];
        const dst = layoutNodes[edge.target];
        if (!src || !dst) return '';

        const dx = dst.x - src.x;
        const dy = dst.y - src.y;
        const startX = src.x + 90;
        const startY = src.y + (dy > 0 ? 30 : -10);
        const endX = dst.x + 90;
        const endY = dst.y + (dy > 0 ? -10 : 30);
        const midY = (startY + endY) / 2;
        const pathData = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
        const strokeColor = edge.type === 'calls' ? '#38bdf8' : '#64748b';
        const strokeDash = edge.type === 'calls' ? 'stroke-dasharray="4 3"' : '';

        return `
      <path
        d="${pathData}"
        fill="none"
        stroke="${strokeColor}"
        stroke-width="1.5"
        ${strokeDash}
        opacity="0.8"
        marker-end="url(#arrow-head)"
      />`;
      })
      .join('\n');

    // Render nodes
    const nodesSvg = filteredNodes
      .map((node) => {
        const pos = layoutNodes[node.filePath];
        if (!pos) return '';
        const cStyle = clusterColors[node.cluster];
        const safeLabel = node.label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safePath = node.filePath.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const displayLabel = safeLabel.length > 18 ? safeLabel.slice(0, 17) + '…' : safeLabel;
        const displayPath = safePath.length > 26 ? '…' + safePath.slice(-25) : safePath;

        return `
      <g transform="translate(${pos.x}, ${pos.y})">
        <rect
          width="180"
          height="54"
          rx="8"
          fill="#090d18"
          stroke="#1e293b"
          stroke-width="1.2"
        />
        <circle cx="14" cy="22" r="4.5" fill="${cStyle.dot}" />
        <text
          x="26"
          y="25"
          fill="#ffffff"
          font-size="11"
          font-weight="700"
          font-family="monospace"
        >
          ${displayLabel}
        </text>
        <text
          x="26"
          y="42"
          fill="#64748b"
          font-size="9"
          font-family="monospace"
        >
          ${displayPath}
        </text>
        <rect
          x="124"
          y="8"
          width="48"
          height="16"
          rx="4"
          fill="#172033"
        />
        <text
          x="148"
          y="19.5"
          fill="#94a3b8"
          font-size="8.5"
          font-family="monospace"
          text-anchor="middle"
        >
          ${node.cluster.slice(0, 8)}
        </text>
      </g>`;
      })
      .join('\n');

    // Subsystem legend in corner
    const legendItems = clusterOrder
      .map((c, idx) => {
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        const x = 50 + col * 200;
        const y = svgHeight - 65 + row * 22;
        return `
        <g transform="translate(${x}, ${y})">
          <circle cx="5" cy="5" r="4" fill="${clusterColors[c].dot}" />
          <text x="15" y="8" fill="#94a3b8" font-size="10.5" font-family="monospace">${c}</text>
        </g>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">
  <defs>
    <marker id="arrow-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 9 5 L 0 9 z" fill="#64748b" />
    </marker>
  </defs>

  <!-- Dark Background -->
  <rect width="100%" height="100%" fill="#080a11" />

  <!-- Document Header -->
  <g transform="translate(50, 42)">
    <text x="0" y="0" fill="#ffffff" font-size="20" font-weight="bold" font-family="sans-serif">
      ${repo.name} — Architecture Topology Map
    </text>
    <text x="0" y="22" fill="#64748b" font-size="11.5" font-family="monospace">
      ATLAS Project Intelligence Platform • ${filteredNodes.length} Modules • ${filteredEdges.length} Dependency Vectors • Branch: ${repo.branch || 'main'}
    </text>
  </g>

  <!-- Graph Content -->
  <g transform="translate(10, 45)">
    ${bandsSvg}
    ${edgesSvg}
    ${nodesSvg}
  </g>

  <!-- Legend -->
  <g id="legend">
    <rect x="35" y="${svgHeight - 90}" width="${svgWidth - 70}" height="68" rx="10" fill="#0d111d" stroke="#1e293b" />
    <text x="50" y="${svgHeight - 74}" fill="#64748b" font-size="9" font-family="monospace" font-weight="bold" letter-spacing="0.08em">SUBSYSTEM TIERS</text>
    ${legendItems}
  </g>
</svg>`;
  };

  const handleExportSvg = () => {
    setIsExporting(true);
    try {
      const svgContent = generateStandaloneSvgString();
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${repo.name.toLowerCase()}_architecture_map.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess('svg');
      setTimeout(() => setExportSuccess(null), 2500);
    } catch (err) {
      console.error('Failed to export SVG:', err);
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const handleExportPng = () => {
    setIsExporting(true);
    try {
      const svgContent = generateStandaloneSvgString();
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const scaleMultiplier = 2; // High-res 2x
          const svgWidth = Math.max(1280, totalWidth + 120);
          const svgHeight = Math.max(760, totalHeight + 160);

          canvas.width = svgWidth * scaleMultiplier;
          canvas.height = svgHeight * scaleMultiplier;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setIsExporting(false);
            setShowExportMenu(false);
            return;
          }

          ctx.fillStyle = '#080a11';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob((pngBlob) => {
            if (pngBlob) {
              const pngUrl = URL.createObjectURL(pngBlob);
              const a = document.createElement('a');
              a.href = pngUrl;
              a.download = `${repo.name.toLowerCase()}_architecture_map.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(pngUrl);
              setExportSuccess('png');
              setTimeout(() => setExportSuccess(null), 2500);
            }
            setIsExporting(false);
            setShowExportMenu(false);
          }, 'image/png');
        } catch (e) {
          console.error('Error drawing PNG canvas:', e);
          setIsExporting(false);
          setShowExportMenu(false);
        } finally {
          URL.revokeObjectURL(url);
        }
      };

      img.onerror = (e) => {
        console.error('Error loading SVG into Image for PNG conversion:', e);
        setIsExporting(false);
        setShowExportMenu(false);
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (err) {
      console.error('Failed to export PNG:', err);
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const selectedNode = selectedNodeId ? graph.nodeMap[selectedNodeId] : null;
  const selectedFile = selectedNodeId ? repo.fileMap[selectedNodeId] : null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-slate-950 overflow-hidden relative">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2.5 z-20 gap-3">
        <div className="flex items-center gap-3">
          {/* Node Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search graph nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-60 rounded-md border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Module Cluster Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={selectedCluster}
              onChange={(e) => setSelectedCluster(e.target.value)}
              className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none font-mono"
            >
              <option value="all">All Subsystems</option>
              {clusterOrder.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Relationship filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={relationFilter}
              onChange={(e) => setRelationFilter(e.target.value as any)}
              className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none font-mono"
            >
              <option value="all">All Edges</option>
              <option value="imports">Imports Only</option>
              <option value="calls">Function Calls Only</option>
            </select>
          </div>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-slate-800 bg-slate-950 p-0.5">
            <button
              onClick={() => setScale((s) => Math.min(2.5, s * 1.15))}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setScale((s) => Math.max(0.3, s * 0.85))}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={fitView}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              title="Fit to Screen"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {Math.round(scale * 100)}%
          </span>

          <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

          {/* Export Map Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting || graph.nodes.length === 0}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-mono font-medium transition shadow-sm ${
                exportSuccess
                  ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                  : 'border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-700 hover:bg-slate-900 hover:text-white'
              } disabled:opacity-50`}
              title="Export Architecture Map for Documentation"
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
              ) : exportSuccess ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Download className="h-3.5 w-3.5 text-indigo-400" />
              )}
              <span>
                {exportSuccess ? `Exported ${exportSuccess.toUpperCase()}!` : isExporting ? 'Generating...' : 'Export Map'}
              </span>
              <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-800 bg-[#0f1322] p-1.5 shadow-2xl z-30 space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800/80">
                  Export for Documentation
                </div>
                <button
                  onClick={handleExportSvg}
                  disabled={isExporting}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-mono text-slate-200 hover:bg-slate-800/90 transition group"
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-semibold text-white">Export as SVG</div>
                      <div className="text-[10px] text-slate-400">Lossless vector graphics</div>
                    </div>
                  </div>
                  <span className="rounded bg-indigo-500/15 px-1.5 py-0.5 text-[9px] text-indigo-300 font-bold">
                    .SVG
                  </span>
                </button>
                <button
                  onClick={handleExportPng}
                  disabled={isExporting}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-mono text-slate-200 hover:bg-slate-800/90 transition group"
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-[#d4ff59] group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-semibold text-white">Export as PNG</div>
                      <div className="text-[10px] text-slate-400">High-res 2x retina raster</div>
                    </div>
                  </div>
                  <span className="rounded bg-[#d4ff59]/15 px-1.5 py-0.5 text-[9px] text-[#d4ff59] font-bold">
                    .PNG
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Graph Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden bg-dot-grid"
      >
        {graph.nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 max-w-md space-y-4 shadow-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <Box className="h-7 w-7 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white font-mono">Fresh Architecture Canvas (0 Nodes)</h3>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  No architectural modules indexed yet. Use the repository switcher to explore demo codebases or open the Ingest modal to map any GitHub repository.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <svg
            className="w-full h-full select-none overflow-visible pointer-events-auto"
            style={{ width: '100%', height: '100%' }}
          >
            <defs>
              <marker
                id="arrow-default"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#475569" />
              </marker>
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#818cf8" />
              </marker>
            </defs>

            <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
              {/* Render Cluster Background Bands */}
          {tierBands.map((band) => {
            return (
              <g key={band.name}>
                <rect
                  x={band.x}
                  y={band.y}
                  width={band.width}
                  height={band.height}
                  rx="12"
                  fill="rgba(15, 23, 42, 0.45)"
                  stroke="rgba(51, 65, 85, 0.35)"
                  strokeDasharray="4 4"
                />
                <text
                  x={band.x + 18}
                  y={band.y + 24}
                  fill="rgba(148, 163, 184, 0.8)"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="monospace"
                  letterSpacing="0.05em"
                >
                  {band.name.toUpperCase()} TIER ({band.count} {band.count === 1 ? 'module' : 'modules'})
                </text>
              </g>
            );
          })}

          {/* Render Edges */}
          {filteredEdges.map((edge, edgeIndex) => {
            const src = layoutNodes[edge.source];
            const dst = layoutNodes[edge.target];
            if (!src || !dst) return null;

            const isEdgeActive =
              activeFocusNodeId &&
              (edge.source === activeFocusNodeId || edge.target === activeFocusNodeId);
            const isDimmed = activeFocusNodeId && !isEdgeActive;

            // Curve calculation for smooth hierarchical flow
            const dx = dst.x - src.x;
            const dy = dst.y - src.y;
            const startX = src.x + 90;
            const startY = src.y + (dy > 0 ? 30 : -10);
            const endX = dst.x + 90;
            const endY = dst.y + (dy > 0 ? -10 : 30);

            const midY = (startY + endY) / 2;
            const pathData = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

            return (
              <g key={`${edge.id}-${edgeIndex}`} opacity={isDimmed ? 0.15 : 0.85}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={isEdgeActive ? '#818cf8' : edge.type === 'calls' ? '#38bdf8' : '#475569'}
                  strokeWidth={isEdgeActive ? 2.5 : 1.2}
                  strokeDasharray={edge.type === 'calls' ? '4 3' : undefined}
                  markerEnd={isEdgeActive ? 'url(#arrow-active)' : 'url(#arrow-default)'}
                />
                {isEdgeActive && edge.label && (
                  <text
                    x={(startX + endX) / 2}
                    y={midY - 4}
                    fill="#c7d2fe"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Render Interactive Nodes */}
          {filteredNodes.map((node) => {
            const pos = layoutNodes[node.filePath];
            if (!pos) return null;

            const isSelected = selectedNodeId === node.filePath;
            const isHovered = hoveredNodeId === node.filePath;
            const isConnected = connectedNodeIds.has(node.filePath);
            const isDimmed = activeFocusNodeId && !isConnected;

            const cStyle = clusterColors[node.cluster];

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                opacity={isDimmed ? 0.3 : 1}
                className="cursor-pointer transition-transform"
                onClick={() => setSelectedNodeId(isSelected ? null : node.filePath)}
                onMouseEnter={() => setHoveredNodeId(node.filePath)}
                onMouseLeave={() => setHoveredNodeId(null)}
              >
                {/* Node Box */}
                <rect
                  width="180"
                  height="54"
                  rx="8"
                  fill="#0b1120"
                  stroke={
                    isSelected
                      ? '#818cf8'
                      : isHovered
                      ? '#38bdf8'
                      : isConnected && activeFocusNodeId
                      ? '#6366f1'
                      : '#1e293b'
                  }
                  strokeWidth={isSelected || isHovered ? 2 : 1}
                  className="filter drop-shadow-md"
                />

                {/* Left accent color dot */}
                <circle cx="14" cy="22" r="4" fill={cStyle.dot} />

                {/* File Label */}
                <text
                  x="26"
                  y="26"
                  fill={isSelected ? '#ffffff' : '#f1f5f9'}
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {node.label.length > 16 ? `${node.label.slice(0, 15)}…` : node.label}
                </text>

                {/* Subtitle: cluster + coupling info */}
                <text
                  x="26"
                  y="42"
                  fill="#64748b"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {node.cluster} • In:{node.metrics.inDegree} Out:{node.metrics.outDegree}
                </text>

                {/* Hotspot indicator badge */}
                {node.metrics.inDegree >= 3 && (
                  <g transform="translate(155, 6)">
                    <circle cx="8" cy="8" r="7" fill="#f43f5e" />
                    <text
                      x="8"
                      y="11"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      !
                    </text>
                  </g>
                )}
              </g>
            );
          })}
            </g>
          </svg>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-20 rounded-lg border border-slate-800 bg-slate-900/90 p-3 shadow-xl backdrop-blur-sm hidden sm:block">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 font-mono">
            Architecture Tiers
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono">
            {clusterOrder.map((c) => (
              <div key={c} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: clusterColors[c].dot }}
                />
                <span className="text-slate-300">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && selectedFile && (
        <div className="absolute right-0 top-12 bottom-0 w-80 sm:w-96 border-l border-slate-800 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-md z-30 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase border ${clusterColors[selectedNode.cluster].bg} ${clusterColors[selectedNode.cluster].border} ${clusterColors[selectedNode.cluster].text}`}
                >
                  {selectedNode.cluster}
                </span>
                <h3 className="mt-1 text-base font-bold text-white font-mono truncate">
                  {selectedNode.label}
                </h3>
                <p className="text-xs text-slate-400 font-mono break-all mt-0.5">
                  {selectedNode.filePath}
                </p>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-slate-500 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800 font-mono text-center">
              <div className="bg-slate-950 p-2 rounded">
                <div className="text-[10px] text-slate-500">Callers (Ca)</div>
                <div className="text-sm font-bold text-slate-200">
                  {selectedNode.metrics.inDegree}
                </div>
              </div>
              <div className="bg-slate-950 p-2 rounded">
                <div className="text-[10px] text-slate-500">Imports (Ce)</div>
                <div className="text-sm font-bold text-slate-200">
                  {selectedNode.metrics.outDegree}
                </div>
              </div>
              <div className="bg-slate-950 p-2 rounded">
                <div className="text-[10px] text-slate-500">Lines</div>
                <div className="text-sm font-bold text-slate-200">
                  {selectedFile.linesCount}
                </div>
              </div>
            </div>

            {/* Symbols */}
            <div>
              <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-indigo-400" />
                <span>Defined Symbols ({selectedFile.symbols.length})</span>
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {selectedFile.symbols.length === 0 ? (
                  <div className="text-xs text-slate-500">No top-level exported symbols.</div>
                ) : (
                  selectedFile.symbols.map((sym) => (
                    <div
                      key={sym.id}
                      className="flex items-center justify-between rounded bg-slate-950 px-2 py-1 text-xs font-mono"
                    >
                      <span className="text-slate-300 truncate">{sym.name}</span>
                      <span className="text-[10px] text-indigo-400 bg-indigo-950/60 px-1 rounded">
                        {sym.kind}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Dependents & Dependencies */}
            <div>
              <div className="text-xs font-semibold text-slate-300 mb-1.5">
                Direct Callers ({selectedFile.dependents.length}):
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1 font-mono text-[11px] text-slate-400">
                {selectedFile.dependents.length === 0 ? (
                  <div className="text-slate-500 text-xs">No incoming callers (leaf module).</div>
                ) : (
                  selectedFile.dependents.map((dep) => (
                    <div key={dep} className="truncate">
                      ← {dep.split('/').pop()}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 space-y-2 border-t border-slate-800">
            <button
              onClick={() => onAnalyzeImpact(selectedNode.filePath)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500 transition shadow-md shadow-amber-600/20"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>What Breaks If I Change This?</span>
            </button>
            <button
              onClick={() => onNavigateToCode(selectedNode.filePath)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Inspect Source Code</span>
            </button>
            {onAskAIAboutFile && (
              <button
                onClick={() => onAskAIAboutFile(selectedNode.filePath)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-700/60 bg-indigo-950/60 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-900 transition"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>Ask AI About This Module</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
