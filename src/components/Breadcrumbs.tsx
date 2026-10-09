import React from 'react';
import {
  ChevronRight,
  GitBranch,
  Folder,
  FileCode,
  Home,
  Network,
  AlertTriangle,
  Lightbulb,
  BotMessageSquare,
  GitPullRequest,
  BookOpen,
  GitFork,
  Copy,
  Check,
  Zap,
  Settings,
} from 'lucide-react';
import { RepositoryModel } from '../types/atlas';
import { NavTabId } from './Sidebar';

interface BreadcrumbsProps {
  currentRepo: RepositoryModel;
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  currentFilePath?: string;
  currentLine?: number;
  onNavigateToFile?: (filePath: string) => void;
  onAnalyzeImpact?: (filePath: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  currentRepo,
  activeTab,
  onSelectTab,
  currentFilePath,
  currentLine,
  onNavigateToFile,
  onAnalyzeImpact,
}) => {
  const [copied, setCopied] = React.useState(false);

  const tabLabels: Record<NavTabId, { label: string; icon: any }> = {
    overview: { label: 'Overview', icon: Home },
    architecture: { label: 'Architecture Map', icon: Network },
    explorer: { label: 'Code Explorer', icon: Folder },
    dependencies: { label: 'Dependencies', icon: GitFork },
    impact: { label: 'What Breaks?', icon: AlertTriangle },
    'feature-impact': { label: 'Feature Impact', icon: Lightbulb },
    chat: { label: 'AI Assistant', icon: BotMessageSquare },
    'pull-requests': { label: 'Pull Requests', icon: GitPullRequest },
    onboarding: { label: 'Onboarding Guide', icon: BookOpen },
    settings: { label: 'Settings & API Key', icon: Settings },
  };

  const currentTabInfo = tabLabels[activeTab] || { label: 'View', icon: Home };
  const TabIcon = currentTabInfo.icon;

  // Determine file path segments if in explorer, impact, or if file is currently tracked
  const targetPath =
    activeTab === 'explorer' || activeTab === 'impact' || activeTab === 'architecture'
      ? currentFilePath
      : undefined;

  const pathSegments = targetPath ? targetPath.split('/') : [];
  const fileName = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
  const dirSegments = pathSegments.slice(0, pathSegments.length - 1);

  const handleCopyPath = () => {
    if (targetPath) {
      navigator.clipboard.writeText(targetPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentFileObj = targetPath ? currentRepo.fileMap[targetPath] : null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="w-full border-b border-[#1c1e2a] bg-[#090a0f] px-4 sm:px-6 py-2 text-xs font-mono z-30"
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {/* Left: Breadcrumb segment trail */}
        <ol className="flex items-center gap-1.5 whitespace-nowrap text-slate-400">
          {/* 1. Repository Root */}
          <li className="flex items-center gap-1.5">
            <button
              onClick={() => onSelectTab('overview')}
              className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-slate-300 hover:bg-slate-900 hover:text-white transition"
              title="Go to Repository Overview"
            >
              <span className="font-bold text-indigo-400">{currentRepo.name}</span>
            </button>
          </li>

          {/* Branch badge */}
          <li className="flex items-center text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.2 rounded">
            <GitBranch className="h-2.5 w-2.5 mr-1 text-slate-400" />
            <span>{currentRepo.branch}</span>
          </li>

          <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />

          {/* 2. Current View / Tab */}
          <li className="flex items-center gap-1.5">
            <button
              onClick={() => onSelectTab(activeTab)}
              className={`flex items-center gap-1.5 rounded px-1.5 py-0.5 transition ${
                !targetPath
                  ? 'bg-indigo-600/10 text-indigo-300 font-semibold border border-indigo-500/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <TabIcon className="h-3 w-3 text-indigo-400" />
              <span>{currentTabInfo.label}</span>
            </button>
          </li>

          {/* 3. Folder Segments */}
          {dirSegments.map((dir, idx) => {
            const accumulatedPath = dirSegments.slice(0, idx + 1).join('/');
            return (
              <React.Fragment key={accumulatedPath}>
                <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />
                <li className="flex items-center">
                  <span className="flex items-center gap-1 rounded px-1 py-0.5 text-slate-400">
                    <Folder className="h-3 w-3 text-indigo-400/70" />
                    <span>{dir}</span>
                  </span>
                </li>
              </React.Fragment>
            );
          })}

          {/* 4. Active File Name */}
          {fileName && (
            <>
              <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />
              <li className="flex items-center">
                <span className="flex items-center gap-1.5 rounded bg-slate-900 border border-slate-800 px-2 py-0.5 font-bold text-slate-100">
                  <FileCode className="h-3 w-3 text-amber-400" />
                  <span>{fileName}</span>
                  {currentLine && (
                    <span className="text-[10px] text-amber-400 font-normal">
                      :{currentLine}
                    </span>
                  )}
                </span>
              </li>
            </>
          )}

          {/* Subsystem Tag if available */}
          {currentFileObj && (
            <li className="hidden sm:flex items-center ml-1">
              <span className="rounded bg-slate-900/80 border border-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                {currentFileObj.moduleCluster}
              </span>
            </li>
          )}
        </ol>

        {/* Right: Quick Context Actions */}
        {targetPath && (
          <div className="flex items-center gap-2 shrink-0">
            {activeTab !== 'impact' && onAnalyzeImpact && (
              <button
                onClick={() => onAnalyzeImpact(targetPath)}
                className="hidden md:flex items-center gap-1 rounded bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 text-[11px] text-amber-300 hover:bg-amber-900/60 transition"
                title="Calculate blast radius for this file"
              >
                <Zap className="h-2.5 w-2.5 text-amber-400" />
                <span>Blast Radius</span>
              </button>
            )}

            <button
              onClick={handleCopyPath}
              className="flex items-center gap-1 rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition"
              title="Copy file path to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span className="hidden sm:inline">Copy Path</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
