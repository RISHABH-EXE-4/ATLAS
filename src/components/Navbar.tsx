import React, { useState } from 'react';
import {
  Search,
  Bell,
  Mail,
  ChevronDown,
  Layers,
  Github,
  GitBranch,
  Menu,
  X,
  Sparkles,
  GraduationCap,
  Code2,
  Building2,
  RotateCcw,
  Settings,
  Key,
  Palette,
} from 'lucide-react';
import { RepositoryModel, PersonaMode, UserProfile, DEFAULT_USER_PROFILE } from '../types/atlas';
import { AppSettings } from '../types/settings';
import { COMPLETE_THEMES, CompleteTheme, applyThemeToDocument } from '../utils/themeEngine';
import { User, Shield, Check, RefreshCw } from 'lucide-react';

interface NavbarProps {
  currentRepo: RepositoryModel;
  allRepos: RepositoryModel[];
  onSelectRepo: (repo: RepositoryModel) => void;
  persona: PersonaMode;
  onChangePersona: (persona: PersonaMode) => void;
  userProfile?: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
  settings?: AppSettings;
  onUpdateSettings?: (settings: AppSettings) => void;
  onOpenIngestModal: () => void;
  onOpenSearch: () => void;
  onResetToFreshStart?: () => void;
  onResetToAbsoluteDefault?: () => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRepo,
  allRepos,
  onSelectRepo,
  persona,
  onChangePersona,
  userProfile = DEFAULT_USER_PROFILE,
  onUpdateProfile,
  settings,
  onUpdateSettings,
  onOpenIngestModal,
  onOpenSearch,
  onResetToFreshStart,
  onResetToAbsoluteDefault,
  mobileMenuOpen,
  onToggleMobileMenu,
  activeTab,
  onSelectTab,
}) => {
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const personaConfig: Record<PersonaMode, { label: string; icon: any }> = {
    beginner: { label: 'Beginner Teacher', icon: GraduationCap },
    developer: { label: 'Principal Dev', icon: Code2 },
    architect: { label: 'System Architect', icon: Building2 },
  };

  const CurrentPersonaIcon = personaConfig[persona].icon;

  return (
    <header
      className="w-full bg-[#090a0f] px-4 sm:px-6 pt-4 pb-2 z-40 select-none transition-colors duration-300"
      style={{ backgroundColor: 'var(--theme-bg-app, #090a0f)' }}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
        {/* Left: Search Bar Pill Container */}
        <div className="flex-1 max-w-xl">
          <button
            onClick={onOpenSearch}
            className="flex w-full items-center gap-3 rounded-full border border-[#232635] bg-[#14151e] px-4 py-2.5 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-200 transition shadow-sm group"
          >
            <Search className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition" />
            <span className="truncate">Search codebase, AST symbols, architecture, or ask a question...</span>
            <kbd className="ml-auto hidden rounded-full bg-[#1f2231] px-2 py-0.5 text-[10px] font-mono text-slate-400 sm:inline">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Center / Right: Repository Switcher & User Profile Tools */}
        <div className="flex items-center gap-3">
          {/* Repository Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setRepoDropdownOpen(!repoDropdownOpen)}
              className="flex items-center gap-2 rounded-full border border-[#232635] bg-[#14151e] px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-700 hover:bg-[#1a1c27]"
            >
              <Github className="h-3.5 w-3.5 text-purple-400" />
              <span className="max-w-[120px] sm:max-w-[160px] truncate font-mono text-xs font-semibold">
                {currentRepo.name}
              </span>
              <span className="flex items-center text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.2 rounded-full">
                <GitBranch className="h-2.5 w-2.5 mr-0.5" />
                {currentRepo.branch}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {repoDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setRepoDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-[#262838] bg-[#14151e] p-2 shadow-2xl">
                  <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Switch Codebase
                  </div>
                  {allRepos.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => {
                        onSelectRepo(repo);
                        setRepoDropdownOpen(false);
                      }}
                      className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left transition ${
                        currentRepo.id === repo.id
                          ? 'bg-[#d4ff59]/15 text-[#d4ff59]'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <div className="flex-1 truncate">
                        <div className="text-xs font-bold font-mono">{repo.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{repo.description}</div>
                      </div>
                    </button>
                  ))}

                  <div className="my-1.5 border-t border-slate-800" />

                  {/* Action: Reset to Absolute Default */}
                  {(onResetToAbsoluteDefault || onResetToFreshStart) && (
                    <button
                      onClick={() => {
                        setRepoDropdownOpen(false);
                        if (onResetToAbsoluteDefault) onResetToAbsoluteDefault();
                        else if (onResetToFreshStart) onResetToFreshStart();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-950/40 transition"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Reset to Absolute Default (0 Values)</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setRepoDropdownOpen(false);
                      onOpenIngestModal();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-purple-300 hover:bg-purple-950/40 transition"
                  >
                    <Github className="h-3.5 w-3.5" />
                    <span>+ Ingest Public GitHub Repo...</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Quick Absolute Default Reset Button */}
          {(onResetToAbsoluteDefault || onResetToFreshStart) && (
            <button
              onClick={() => {
                if (onResetToAbsoluteDefault) onResetToAbsoluteDefault();
                else if (onResetToFreshStart) onResetToFreshStart();
              }}
              className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-3 py-1.5 text-xs font-mono font-medium text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-500/50 transition active:scale-95 shadow-sm"
              title="Reset all codebase metrics, profile, and tabs to absolute default (0 values)"
            >
              <RotateCcw className="h-3 w-3 text-emerald-400" />
              <span className="hidden sm:inline">Absolute Default (0)</span>
            </button>
          )}

          {/* Google AI Studio API Key Pill Button */}
          <button
            onClick={() => onSelectTab('settings')}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-mono font-medium transition active:scale-95 shadow-sm ${
              settings?.geminiApiKey
                ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-500/50'
                : 'border-amber-500/40 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 hover:border-amber-500/60 animate-pulse'
            }`}
            title={settings?.geminiApiKey ? "Google AI Studio API Key active — Click to manage in Settings" : "Google AI Studio API Key required for AI actions — Click to set in Settings"}
          >
            <Key className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">
              {settings?.geminiApiKey ? 'Google AI: Active' : 'Set Google AI Key'}
            </span>
            {settings?.geminiApiKey ? (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            )}
          </button>

          {/* Notification Bell Circle */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setHasUnreadAlerts(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#232635] bg-[#14151e] text-slate-400 hover:text-white hover:bg-slate-800 transition relative"
              title="Notifications & Alerts"
            >
              <Bell className="h-4 w-4" />
              {hasUnreadAlerts && (
                <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-[#d4ff59]" />
              )}
            </button>

            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-[#262838] bg-[#14151e] p-3 shadow-2xl text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono font-bold text-slate-300">System Alerts</span>
                    <span className="text-[10px] text-emerald-400 font-mono">0 Pending</span>
                  </div>
                  <div className="text-slate-400 text-center py-4 text-xs font-mono">
                    All telemetry clear. Clean baseline.
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mail / Message Icon */}
          <button
            onClick={() => onSelectTab('chat')}
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-[#232635] bg-[#14151e] text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Open AI Repository Chat"
          >
            <Mail className="h-4 w-4" />
          </button>

          {/* Quick Theme Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              className="flex items-center gap-1.5 rounded-full border border-[#232635] bg-[#14151e] px-2.5 sm:px-3 py-1.5 text-xs font-mono font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95 shadow-sm"
              title="Quick Theme Switcher (Solar Amber, Neon Lime, etc.)"
            >
              <span
                className="h-3 w-3 rounded-full shadow-sm transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: settings?.accentColor || '#d4ff59',
                  boxShadow: `0 0 10px ${settings?.accentColor || '#d4ff59'}`,
                }}
              />
              <span className="hidden lg:inline text-[11px] font-bold">
                {COMPLETE_THEMES.find(
                  (t) =>
                    t.accentHex.toLowerCase() === (settings?.accentColor || '').toLowerCase() &&
                    t.modeId === settings?.themeMode
                )?.name || 'Theme'}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {themeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setThemeDropdownOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-[#262838] bg-[#14151e] p-2.5 shadow-2xl text-xs space-y-1 animate-scale-in">
                  <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-800 text-[11px] font-mono font-bold text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5" style={{ color: settings?.accentColor || '#d4ff59' }} />
                      Quick Themes
                    </span>
                    <span className="text-[10px] text-slate-500">Instant Switch</span>
                  </div>

                  <div className="py-1 max-h-72 overflow-y-auto space-y-1">
                    {COMPLETE_THEMES.map((th) => {
                      const isSelected =
                        (settings?.accentColor || '').toLowerCase() === th.accentHex.toLowerCase() &&
                        settings?.themeMode === th.modeId;

                      return (
                        <button
                          key={th.id}
                          onClick={() => {
                            if (onUpdateSettings && settings) {
                              onUpdateSettings({
                                ...settings,
                                accentColor: th.accentHex,
                                themeMode: th.modeId,
                              });
                            }
                            applyThemeToDocument(th.accentHex, th.modeId);
                            setThemeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition ${
                            isSelected
                              ? 'bg-slate-800 font-bold'
                              : 'hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base shrink-0">{th.emoji}</span>
                            <div className="truncate">
                              <div className="text-xs font-mono text-white truncate flex items-center gap-1.5">
                                <span>{th.name}</span>
                                {th.id === 'solar-amber' && (
                                  <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-400 font-bold">
                                    Hot
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-sans truncate">
                                {th.badge}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className="h-3 w-3 rounded-full border border-black/40"
                              style={{ backgroundColor: th.accentHex }}
                            />
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 stroke-[3]" style={{ color: th.accentHex }} />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1.5 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setThemeDropdownOpen(false);
                        onSelectTab('settings');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
                    >
                      <Settings className="h-3 w-3" />
                      <span>All Appearance &amp; Customization...</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Settings Gear Button */}
          <button
            onClick={() => onSelectTab('settings')}
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-[#232635] bg-[#14151e] transition ${
              activeTab === 'settings'
                ? 'text-[#d4ff59] border-[#d4ff59]/60 bg-[#1a1c27] shadow-[0_0_15px_rgba(212,255,89,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Open Settings & Customization"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* User Profile / Persona Pill from design */}
          <div className="relative">
            <button
              onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
              className="flex items-center gap-2.5 rounded-full border border-[#232635] bg-[#14151e] pl-1.5 pr-3 py-1 text-xs transition hover:border-slate-700 hover:bg-[#1a1c27]"
            >
              {/* Avatar circle */}
              <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr ${userProfile.avatarColor || 'from-purple-600 to-indigo-500'} font-bold text-white shadow-sm overflow-hidden text-xs`}>
                <span>{userProfile.initials || 'DU'}</span>
              </div>
              <div className="hidden md:flex flex-col text-left leading-tight">
                <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{userProfile.name}</span>
                <span className="text-xs font-bold text-slate-100 font-mono">
                  {personaConfig[persona].label}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-500" />
            </button>

            {personaDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setPersonaDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-[#262838] bg-[#14151e] p-3 shadow-2xl">
                  {/* Profile Header Details */}
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800 mb-2.5">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr ${userProfile.avatarColor || 'from-purple-600 to-indigo-500'} font-bold text-white shadow-sm text-sm`}>
                      <span>{userProfile.initials || 'DU'}</span>
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-white font-mono truncate">{userProfile.name}</div>
                      <div className="text-[10px] text-purple-300 font-medium">{personaConfig[persona].label}</div>
                      <div className="text-[9px] text-slate-500 truncate">{userProfile.email}</div>
                    </div>
                  </div>

                  <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Reasoning Persona
                  </div>
                  {(['beginner', 'developer', 'architect'] as PersonaMode[]).map((p) => {
                    const cfg = personaConfig[p];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          onChangePersona(p);
                          setPersonaDropdownOpen(false);
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition ${
                          persona === p
                            ? 'bg-[#d4ff59]/20 text-[#d4ff59] font-bold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-xs">{cfg.label}</span>
                      </button>
                    );
                  })}

                  <div className="my-2 border-t border-slate-800" />

                  {/* Settings Navigation */}
                  <button
                    onClick={() => {
                      setPersonaDropdownOpen(false);
                      onSelectTab('settings');
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  >
                    <Settings className="h-3.5 w-3.5 text-slate-400" />
                    <span>Settings &amp; Google AI Key</span>
                  </button>

                  {/* Absolute Default Reset from Profile Menu */}
                  {(onResetToAbsoluteDefault || onResetToFreshStart) && (
                    <button
                      onClick={() => {
                        setPersonaDropdownOpen(false);
                        if (onResetToAbsoluteDefault) onResetToAbsoluteDefault();
                        else if (onResetToFreshStart) onResetToFreshStart();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-950/40 transition"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Set Everything to Absolute Default</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={onToggleMobileMenu}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#232635] bg-[#14151e] text-slate-300 lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
