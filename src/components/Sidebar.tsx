import React from 'react';
import {
  Database,
  Network,
  FolderCode,
  GitFork,
  AlertTriangle,
  Lightbulb,
  BotMessageSquare,
  GitPullRequest,
  BookOpen,
  Settings,
} from 'lucide-react';
import { AtlasLogo } from './AtlasLogo';

export type NavTabId =
  | 'overview'
  | 'architecture'
  | 'explorer'
  | 'dependencies'
  | 'impact'
  | 'feature-impact'
  | 'chat'
  | 'pull-requests'
  | 'onboarding'
  | 'settings';

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  hotspotsCount?: number;
  cyclesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const navItems: Array<{
    id: NavTabId;
    label: string;
    icon: any;
  }> = [
    { id: 'overview', label: 'Dashboard & Metrics', icon: Database },
    { id: 'architecture', label: 'Architecture Map', icon: Network },
    { id: 'explorer', label: 'Code Explorer', icon: FolderCode },
    { id: 'impact', label: 'What Breaks If I Change This?', icon: AlertTriangle },
    { id: 'feature-impact', label: 'Feature Impact Analyzer', icon: Lightbulb },
    { id: 'dependencies', label: 'Dependencies & Coupling', icon: GitFork },
    { id: 'chat', label: 'AI Code Assistant', icon: BotMessageSquare },
    { id: 'pull-requests', label: 'Pull Request Intel', icon: GitPullRequest },
    { id: 'onboarding', label: 'Onboarding Guide', icon: BookOpen },
  ];

  return (
    <aside
      className="shrink-0 flex flex-col items-center justify-between py-4 px-2 my-4 ml-4 w-16 sm:w-20 rounded-[2.5rem] bg-[#14151e] border border-[#232635] shadow-2xl z-30 select-none transition-colors duration-300"
      style={{
        backgroundColor: 'var(--theme-bg-surface, #14151e)',
        borderColor: 'var(--theme-border, #232635)',
      }}
    >
      {/* Top: Iconic Purple Hexagonal Logo */}
      <div className="pt-1 flex flex-col items-center">
        <button
          onClick={() => onSelectTab('overview')}
          className="focus:outline-none transition-transform hover:scale-105"
          title="ATLAS Dashboard"
        >
          <AtlasLogo size="md" showWordmark={false} />
        </button>
      </div>

      {/* Middle: Vertical Stack of Circular Nav Buttons */}
      <div className="flex flex-col items-center gap-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => onSelectTab(item.id)}
                className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-[#d4ff59] text-black font-extrabold shadow-[0_0_20px_rgba(212,255,89,0.4)] scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80 hover:scale-105'
                }`}
                aria-label={item.label}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-black stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </button>

              {/* Floating Tooltip */}
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-800 bg-[#161722] px-3 py-1.5 text-xs font-mono font-medium text-slate-200 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-1.5 rounded bg-[#d4ff59]/20 text-[#d4ff59] px-1 py-0.2 text-[9px] uppercase font-bold">
                    Active
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom: Settings Gear Icon */}
      <div className="pb-1">
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 group relative ${
            activeTab === 'settings'
              ? 'bg-[#d4ff59] text-black font-extrabold shadow-[0_0_20px_rgba(212,255,89,0.4)] scale-105'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80 hover:scale-105'
          }`}
          title="Settings, Google AI API Key & Customization"
          aria-label="Settings & Configuration"
        >
          <Settings
            className={`h-5 w-5 ${
              activeTab === 'settings' ? 'text-black stroke-[2.4] rotate-45' : 'stroke-[1.8] group-hover:rotate-45'
            } transition-transform duration-300`}
          />
          <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-800 bg-[#161722] px-2.5 py-1 text-xs font-mono text-slate-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50">
            Settings &amp; Google API Key
          </div>
        </button>
      </div>
    </aside>
  );
};
