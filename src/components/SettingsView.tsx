import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Sliders,
  Palette,
  Layers,
  User,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Cpu,
  Zap,
  Lock,
  Unlock,
  RefreshCw,
  SlidersHorizontal,
  Server,
  Activity,
  FileCode,
  CheckCheck,
  Download,
  Upload,
} from 'lucide-react';
import { AppSettings, DEFAULT_APP_SETTINGS } from '../types/settings';
import { UserProfile, DEFAULT_USER_PROFILE } from '../types/atlas';
import {
  setStoredGeminiApiKey,
  getStoredGeminiApiKey,
  detectApiKeyFormat,
  cleanApiKey,
} from '../utils/aiClient';
import {
  ACCENT_PRESETS,
  THEME_MODE_PRESETS,
  COMPLETE_THEMES,
  CompleteTheme,
  applyThemeToDocument,
} from '../utils/themeEngine';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  userProfile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
  onResetToAbsoluteDefault: () => void;
  onNavigateTab: (tab: string) => void;
}

type SettingsSection = 'api-key' | 'appearance' | 'ingestion' | 'profile' | 'diagnostics';

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  userProfile,
  onUpdateProfile,
  onResetToAbsoluteDefault,
  onNavigateTab,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('api-key');
  const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey || getStoredGeminiApiKey());
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [themeToast, setThemeToast] = useState<string | null>(null);

  const handleSelectAccent = (hex: string, label: string) => {
    onUpdateSettings({ ...settings, accentColor: hex });
    applyThemeToDocument(hex, settings.themeMode);
    setThemeToast(`Applied ${label} theme! Entire UI transformed.`);
    setTimeout(() => setThemeToast(null), 2500);
  };

  const handleSelectThemeMode = (
    modeId: 'dark' | 'solar' | 'midnight' | 'cyberpunk' | 'amoled',
    label: string
  ) => {
    onUpdateSettings({ ...settings, themeMode: modeId });
    applyThemeToDocument(settings.accentColor, modeId);
    setThemeToast(`Switched workspace atmosphere to ${label}!`);
    setTimeout(() => setThemeToast(null), 2500);
  };

  const handleSelectCompleteTheme = (theme: CompleteTheme) => {
    onUpdateSettings({
      ...settings,
      accentColor: theme.accentHex,
      themeMode: theme.modeId,
    });
    applyThemeToDocument(theme.accentHex, theme.modeId);
    setThemeToast(`Applied ${theme.name} Theme! Entire UI transformed.`);
    setTimeout(() => setThemeToast(null), 3000);
  };

  // Sync state if settings change
  useEffect(() => {
    if (settings.geminiApiKey) {
      setApiKeyInput(settings.geminiApiKey);
    }
  }, [settings.geminiApiKey]);

  // Handle validating key against Google AI Studio
  const handleValidateKey = async () => {
    const cleaned = cleanApiKey(apiKeyInput);
    if (!cleaned) {
      setValidationResult({
        valid: false,
        message: 'Please enter a Google AI Studio API key first (supports AQ.Ab... or AIzaSy...).',
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch('/api/ai/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': cleaned,
        },
        body: JSON.stringify({ apiKey: cleaned }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setValidationResult({
          valid: true,
          message: data.message || `API Key successfully verified! Connected to ${data.model || 'Google Gemini'}.`,
        });
        // Automatically save on successful validation
        handleSaveKey(cleaned);
      } else {
        setValidationResult({
          valid: false,
          message: data.error || 'Authentication failed. Please verify your Google AI Studio API key.',
        });
      }
    } catch (err: any) {
      setValidationResult({
        valid: false,
        message: err.message || 'Network error communicating with server verification endpoint.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveKey = (keyToSave: string) => {
    const cleaned = cleanApiKey(keyToSave);
    setStoredGeminiApiKey(cleaned);
    onUpdateSettings({
      ...settings,
      geminiApiKey: cleaned,
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleClearKey = () => {
    setApiKeyInput('');
    setStoredGeminiApiKey('');
    setValidationResult(null);
    onUpdateSettings({
      ...settings,
      geminiApiKey: '',
    });
  };

  const handleCopyKey = () => {
    if (!apiKeyInput) return;
    navigator.clipboard?.writeText(apiKeyInput);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const accentColorOptions = [
    { label: 'Neon Lime (Atlas Standard)', hex: '#d4ff59', text: 'text-black', bg: 'bg-[#d4ff59]' },
    { label: 'Cyber Emerald', hex: '#10b981', text: 'text-white', bg: 'bg-emerald-500' },
    { label: 'Electric Violet', hex: '#a855f7', text: 'text-white', bg: 'bg-purple-500' },
    { label: 'Hyper Blue', hex: '#38bdf8', text: 'text-black', bg: 'bg-sky-400' },
    { label: 'Solar Amber', hex: '#f59e0b', text: 'text-black', bg: 'bg-amber-500' },
  ];

  const modelsList = [
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      badge: 'Recommended',
      badgeColor: 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
      description: 'Ultra-low latency inference optimized for real-time repository reasoning and chat.',
    },
    {
      id: 'gemini-3.1-flash-lite',
      name: 'Gemini 3.1 Flash Lite',
      badge: 'High Throughput',
      badgeColor: 'bg-cyan-950/60 text-cyan-300 border-cyan-800',
      description: 'Streamlined token processing ideal for high-frequency AST queries.',
    },
    {
      id: 'gemini-3.8-flash',
      name: 'Gemini 3.8 Flash',
      badge: 'Advanced Reasoning',
      badgeColor: 'bg-purple-950/60 text-purple-300 border-purple-800',
      description: 'Maximum architectural intelligence, complex dependency tracing, and deep impact projection.',
    },
    {
      id: 'gemini-flash-latest',
      name: 'Gemini Flash Latest',
      badge: 'Continuous',
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
      description: 'Always points to Google AI Studio’s newest production flash release.',
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-[1600px] mx-auto text-slate-100 animate-slide-up">
      {/* 1. Header Headline */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#232635] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-[#d4ff59] animate-pulse-glow" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#d4ff59]">
              Configuration &amp; Engine
            </span>
          </div>
          <h1
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight"
          >
            System Settings &amp; Customization
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure your Google AI Studio API key, AI model parameters, codebase ingestion thresholds, and interface theme.
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onResetToAbsoluteDefault}
            className="flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-950/30 px-4 py-2 text-xs font-mono font-semibold text-rose-300 hover:bg-rose-900/40 hover:border-rose-500/50 transition active:scale-95"
            title="Reset workspace and all settings to absolute default"
          >
            <RotateCcw className="h-3.5 w-3.5 text-rose-400" />
            <span>Reset to Absolute Default</span>
          </button>
        </div>
      </div>

      {/* 2. Horizontal Section Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <button
          onClick={() => setActiveSection('api-key')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
            activeSection === 'api-key'
              ? 'bg-[#d4ff59] text-black shadow-lg shadow-[#d4ff59]/20'
              : 'border border-[#232635] bg-[#14151e] text-slate-300 hover:bg-[#1a1c27]'
          }`}
        >
          <Key className="h-3.5 w-3.5" />
          <span>Google AI Studio API Key</span>
          {settings.geminiApiKey ? (
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          ) : (
            <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveSection('appearance')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
            activeSection === 'appearance'
              ? 'bg-[#d4ff59] text-black shadow-lg shadow-[#d4ff59]/20'
              : 'border border-[#232635] bg-[#14151e] text-slate-300 hover:bg-[#1a1c27]'
          }`}
        >
          <Palette className="h-3.5 w-3.5" />
          <span>Appearance &amp; Themes</span>
        </button>

        <button
          onClick={() => setActiveSection('ingestion')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
            activeSection === 'ingestion'
              ? 'bg-[#d4ff59] text-black shadow-lg shadow-[#d4ff59]/20'
              : 'border border-[#232635] bg-[#14151e] text-slate-300 hover:bg-[#1a1c27]'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Ingestion &amp; Limits</span>
        </button>

        <button
          onClick={() => setActiveSection('profile')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
            activeSection === 'profile'
              ? 'bg-[#d4ff59] text-black shadow-lg shadow-[#d4ff59]/20'
              : 'border border-[#232635] bg-[#14151e] text-slate-300 hover:bg-[#1a1c27]'
          }`}
        >
          <User className="h-3.5 w-3.5" />
          <span>Profile &amp; Personas</span>
        </button>

        <button
          onClick={() => setActiveSection('diagnostics')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
            activeSection === 'diagnostics'
              ? 'bg-[#d4ff59] text-black shadow-lg shadow-[#d4ff59]/20'
              : 'border border-[#232635] bg-[#14151e] text-slate-300 hover:bg-[#1a1c27]'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>System Diagnostics</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: GOOGLE AI STUDIO API KEY & ENGINE */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'api-key' && (
        <div className="space-y-6">
          {/* Main Key Card */}
          <div className="rounded-[2rem] border border-[#232635] bg-[#14151e] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
                    <Key className="h-4 w-4" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white font-mono">
                    Google AI Studio Key Configuration
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                  Connect your Google AI Studio API key to unlock full-power AI intelligence across ATLAS:
                  grounded repository chat, proactive PR review intelligence, feature impact simulation, and architectural onboarding synthesis.
                </p>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {settings.geminiApiKey ? (
                  <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1.5 text-xs font-mono font-semibold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>API Key Active</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/40 px-3.5 py-1.5 text-xs font-mono font-semibold text-amber-300">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span>Key Required for AI Features</span>
                  </div>
                )}
              </div>
            </div>

            {/* Input & Action Row */}
            <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Google Gemini API Key
                </label>
                {/* Dynamic Live Format Detection Badge */}
                {(() => {
                  const formatInfo = detectApiKeyFormat(apiKeyInput);
                  if (formatInfo.format === 'latest-aq') {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm animate-fade-in">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        <span>Latest Google AI Studio Key (AQ.Ab...)</span>
                      </span>
                    );
                  }
                  if (formatInfo.format === 'classic-aiza') {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm animate-fade-in">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                        <span>Classic Google API Key (AIzaSy...)</span>
                      </span>
                    );
                  }
                  if (formatInfo.format === 'custom') {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm animate-fade-in">
                        <span>Custom API Key Format</span>
                      </span>
                    );
                  }
                  return (
                    <span className="text-[11px] font-mono text-slate-400">
                      Supports latest <code className="text-amber-400 font-bold">AQ.Ab...</code> and <code className="text-slate-300">AIzaSy...</code>
                    </span>
                  );
                })()}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => {
                      setApiKeyInput(e.target.value);
                      setValidationResult(null);
                    }}
                    placeholder="AQ.Ab... or AIzaSy..."
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs sm:text-sm font-mono text-slate-100 placeholder-slate-500 focus:border-[#d4ff59] focus:outline-none focus:ring-1 focus:ring-[#d4ff59]"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-1 hover:text-white transition"
                      title={showApiKey ? 'Hide key' : 'Show key'}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {apiKeyInput && (
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        className="p-1 hover:text-white transition"
                        title="Copy key"
                      >
                        {copiedKey ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Validate / Save Buttons */}
                <button
                  type="button"
                  onClick={handleValidateKey}
                  disabled={isValidating || !apiKeyInput.trim()}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#d4ff59] px-5 py-3 text-xs font-bold text-black shadow-lg shadow-[#d4ff59]/20 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition shrink-0"
                >
                  {isValidating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-black" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 text-black" />
                      <span>Verify &amp; Save Key</span>
                    </>
                  )}
                </button>

                {apiKeyInput && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-xs font-medium text-slate-300 hover:bg-slate-700 transition shrink-0"
                  >
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Validation Result Feedback Box */}
              {validationResult && (
                <div
                  className={`flex flex-col sm:flex-row items-start justify-between gap-3 rounded-2xl p-4 text-xs font-mono ${
                    validationResult.valid
                      ? 'border border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                      : 'border border-rose-500/40 bg-rose-950/20 text-rose-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {validationResult.valid ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="font-bold">
                        {validationResult.valid ? 'Authentication Verified' : 'Verification Issue'}
                      </div>
                      <p className="font-sans leading-relaxed text-slate-300">{validationResult.message}</p>
                    </div>
                  </div>

                  {!validationResult.valid && apiKeyInput.trim() && (
                    <button
                      type="button"
                      onClick={() => handleSaveKey(apiKeyInput)}
                      className="mt-2 sm:mt-0 shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/50 bg-amber-950/50 text-amber-300 hover:bg-amber-900/60 font-semibold transition"
                    >
                      <Check className="h-3.5 w-3.5 text-amber-400" />
                      <span>Save Key Anyway</span>
                    </button>
                  )}
                </div>
              )}

              {/* Helper Step Guide Card */}
              <div className="rounded-2xl border border-slate-800 bg-[#0d0e15] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono font-bold text-slate-300">
                    How to get a Google AI Studio API Key:
                  </div>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#d4ff59] hover:underline"
                  >
                    <span>Open AI Studio</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-400">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                    <div className="font-mono font-bold text-slate-200 mb-1">1. Visit AI Studio</div>
                    <span>Go to <code className="text-slate-300 font-mono">aistudio.google.com/app/apikey</code> with your Google account.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                    <div className="font-mono font-bold text-slate-200 mb-1">2. Create New Key</div>
                    <span>Click <strong>Create API key</strong>. Supports both the newest format starting with <strong className="text-amber-400 font-mono">AQ.Ab...</strong> and classic <strong className="text-slate-300 font-mono">AIzaSy...</strong>.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                    <div className="font-mono font-bold text-slate-200 mb-1">3. Paste &amp; Verify</div>
                    <span>Paste your generated key above and click <strong>Verify &amp; Save</strong>. All AI features activate immediately.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Model Selection Card */}
          <div className="rounded-[2rem] border border-[#232635] bg-[#14151e] p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-mono">Active Gemini Model Engine</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose which model architecture powers code explanations and impact prediction.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modelsList.map((m) => {
                const isSelected = settings.selectedModel === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      onUpdateSettings({ ...settings, selectedModel: m.id as any });
                    }}
                    className={`flex flex-col justify-between p-4 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'border-[#d4ff59] bg-[#d4ff59]/10 shadow-lg shadow-[#d4ff59]/5'
                        : 'border-slate-800 bg-[#0d0e15] hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-bold text-sm text-white">{m.name}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono ${m.badgeColor}`}>
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-sans leading-relaxed">{m.description}</p>
                    </div>
                    {isSelected && (
                      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#d4ff59]">
                        <CheckCheck className="h-3.5 w-3.5" />
                        <span>Active Model</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Hyperparameters Sliders */}
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-300">Temperature</span>
                  <span className="text-[#d4ff59] font-bold">{settings.temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.temperature}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, temperature: parseFloat(e.target.value) })
                  }
                  className="w-full accent-[#d4ff59] bg-slate-800"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0.0 (Strict / Code Grounded)</span>
                  <span>1.0 (Creative Exploratory)</span>
                </div>
              </div>

              {/* Max Output Tokens */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-300">Max Response Length</span>
                  <span className="text-[#d4ff59] font-bold">{settings.maxTokens} tokens</span>
                </div>
                <input
                  type="range"
                  min="512"
                  max="8192"
                  step="512"
                  value={settings.maxTokens}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, maxTokens: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-[#d4ff59] bg-slate-800"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>512 (Brief summaries)</span>
                  <span>8192 (Full architectural specs)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: APPEARANCE & THEMES */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'appearance' && (
        <div className="space-y-6">
          {/* Featured: One-Click Complete Workspace Themes */}
          <div className="rounded-[2rem] border border-[#232635] bg-[#14151e] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4" style={{ color: settings.accentColor }} />
                  <h3 className="text-lg font-bold text-white font-mono">
                    One-Click Complete Workspace Themes
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Select <strong>Solar Amber</strong>, <strong>Neon Lime</strong>, <strong>Cyber Emerald</strong>, or any theme below — the <strong>entire UI transforms instantly</strong> (buttons, cards, telemetry, graphs, navigation, and background atmosphere).
                </p>
              </div>

              {/* Active Theme Badge */}
              <div
                className="flex items-center gap-2 rounded-full border px-3.5 py-1.5 shrink-0"
                style={{
                  backgroundColor: 'var(--theme-accent-light, rgba(245, 158, 11, 0.15))',
                  borderColor: 'var(--theme-accent-border, rgba(245, 158, 11, 0.35))',
                }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full animate-pulse"
                  style={{ backgroundColor: settings.accentColor }}
                />
                <span
                  className="text-xs font-mono font-bold"
                  style={{ color: settings.accentColor }}
                >
                  {COMPLETE_THEMES.find(
                    (t) =>
                      t.accentHex.toLowerCase() === settings.accentColor.toLowerCase() &&
                      t.modeId === settings.themeMode
                  )?.name ||
                    ACCENT_PRESETS.find(
                      (a) => a.hex.toLowerCase() === settings.accentColor.toLowerCase()
                    )?.label ||
                    'Custom Theme'}
                </span>
              </div>
            </div>

            {/* Complete Themes Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {COMPLETE_THEMES.map((th) => {
                const isActive =
                  settings.accentColor.toLowerCase() === th.accentHex.toLowerCase() &&
                  settings.themeMode === th.modeId;

                return (
                  <button
                    key={th.id}
                    onClick={() => handleSelectCompleteTheme(th)}
                    className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between group overflow-hidden ${
                      isActive
                        ? 'bg-slate-800/90 shadow-2xl scale-[1.02]'
                        : 'bg-[#0d0e15] hover:bg-[#12141f] hover:scale-[1.01]'
                    }`}
                    style={{
                      borderColor: isActive ? th.accentHex : '#232635',
                      boxShadow: isActive
                        ? `0 0 25px rgba(${th.accentRgb}, 0.3)`
                        : undefined,
                    }}
                  >
                    <div>
                      {/* Top Bar with Emoji, Label & Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl shrink-0">{th.emoji}</span>
                          <span className="text-xs font-mono font-bold text-white truncate">
                            {th.name}
                          </span>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold shrink-0"
                          style={{
                            backgroundColor: `rgba(${th.accentRgb}, 0.15)`,
                            color: th.accentHex,
                            border: `1px solid rgba(${th.accentRgb}, 0.3)`,
                          }}
                        >
                          {th.badge}
                        </span>
                      </div>

                      {/* Color Preview Swatches */}
                      <div className="flex items-center gap-1.5 my-2">
                        <span
                          className="h-3.5 flex-1 rounded-md shadow-sm border border-black/20"
                          style={{ backgroundColor: th.accentHex }}
                          title={`Accent: ${th.accentHex}`}
                        />
                        <span
                          className="h-3.5 w-6 rounded-md border border-slate-700 shadow-sm"
                          style={{ backgroundColor: th.bgSurface }}
                          title={`Surface: ${th.bgSurface}`}
                        />
                        <span
                          className="h-3.5 w-6 rounded-md border border-slate-700 shadow-sm"
                          style={{ backgroundColor: th.bgApp }}
                          title={`Background: ${th.bgApp}`}
                        />
                      </div>

                      <p className="text-[11px] text-slate-400 font-sans line-clamp-2 leading-relaxed">
                        {th.tagline}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">
                        {th.accentHex}
                      </span>
                      {isActive ? (
                        <span
                          className="flex items-center gap-1 text-[11px] font-mono font-bold"
                          style={{ color: th.accentHex }}
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400 group-hover:text-white transition">
                          Click to apply &rarr;
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Granular Fine-Tuning: Accent Palette Card */}
          <div className="rounded-[2rem] border border-[#232635] bg-[#14151e] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Palette className="h-4 w-4 text-[#d4ff59]" />
                  <h3 className="text-lg font-bold text-white font-mono">
                    Fine-Tune Interface Accent Color
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Select a specific signature color to tint buttons, active indicators, glows, and badges across the entire interface.
                </p>
              </div>

              {/* Current Accent Indicator */}
              <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3.5 py-1.5 shrink-0">
                <span
                  className="h-3 w-3 rounded-full shadow-sm"
                  style={{ backgroundColor: settings.accentColor }}
                />
                <span className="text-xs font-mono font-bold text-slate-200">
                  {ACCENT_PRESETS.find((a) => a.hex.toLowerCase() === settings.accentColor.toLowerCase())?.label || 'Custom Accent'}
                </span>
              </div>
            </div>

            {/* Accent Palette Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ACCENT_PRESETS.map((opt) => {
                const isSelected = settings.accentColor.toLowerCase() === opt.hex.toLowerCase();
                return (
                  <button
                    key={opt.hex}
                    onClick={() => handleSelectAccent(opt.hex, opt.label)}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition relative group overflow-hidden ${
                      isSelected
                        ? 'border-slate-400 bg-slate-800/90 shadow-xl'
                        : 'border-slate-800 bg-[#0d0e15] hover:border-slate-700 hover:bg-[#12141e]'
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: opt.hex,
                            boxShadow: `0 0 20px rgba(${opt.rgb}, 0.25)`,
                          }
                        : {}
                    }
                  >
                    <span
                      className="h-7 w-7 rounded-full shrink-0 shadow-md flex items-center justify-center mt-0.5"
                      style={{ backgroundColor: opt.hex }}
                    >
                      {isSelected && (
                        <Check
                          className="h-4 w-4 stroke-[3]"
                          style={{ color: opt.textContrast }}
                        />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="text-xs font-mono font-bold text-white truncate">
                          {opt.label}
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {opt.hex}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 font-sans">
                        {opt.tagline}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Atmosphere / Surface Theme Modes */}
            <div className="pt-6 border-t border-slate-800/80 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-400" />
                  <span>Workspace Background &amp; Surface Atmosphere</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Change the overall ambient contrast and background luminescence of the workspace.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {THEME_MODE_PRESETS.map((mode) => {
                  const isModeSelected = (settings.themeMode || 'dark') === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => handleSelectThemeMode(mode.id, mode.label)}
                      className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                        isModeSelected
                          ? 'border-slate-400 bg-slate-800/80 shadow-lg'
                          : 'border-slate-800 bg-[#0d0e15] hover:border-slate-700'
                      }`}
                      style={
                        isModeSelected
                          ? {
                              borderColor: settings.accentColor,
                            }
                          : {}
                      }
                    >
                      <div>
                        {/* Swatch Pill */}
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <span
                            className="h-4 w-6 rounded border border-slate-700 shadow-inner"
                            style={{ backgroundColor: mode.bgApp }}
                          />
                          <span
                            className="h-4 w-6 rounded border border-slate-700 shadow-inner"
                            style={{ backgroundColor: mode.bgSurface }}
                          />
                        </div>
                        <div className="text-xs font-mono font-bold text-white">
                          {mode.label}
                        </div>
                        <p className="text-[10.5px] text-slate-400 mt-1 font-sans leading-tight">
                          {mode.tagline}
                        </p>
                      </div>

                      {isModeSelected && (
                        <div
                          className="mt-3 flex items-center gap-1.5 text-[10px] font-mono font-bold"
                          style={{ color: settings.accentColor }}
                        >
                          <Check className="h-3 w-3" />
                          <span>Active Mode</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Theme Showcase / Preview Card */}
            <div className="pt-6 border-t border-slate-800/80 space-y-3">
              <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Live Dynamic Theme Showcase
              </div>
              <div
                className="rounded-2xl border p-5 transition-all duration-300"
                style={{
                  backgroundColor: 'var(--theme-bg-surface, #14151e)',
                  borderColor: 'var(--theme-border, #232635)',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full animate-pulse"
                        style={{ backgroundColor: settings.accentColor }}
                      />
                      <span className="text-xs font-mono font-bold text-white">
                        Whole UI Dynamically Styled in{' '}
                        <span style={{ color: settings.accentColor }}>
                          {ACCENT_PRESETS.find((a) => a.hex.toLowerCase() === settings.accentColor.toLowerCase())?.label || 'Custom'}
                        </span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans">
                      All buttons, graphs, active navigation docks, badges, focus states, and charts reflect this palette instantly.
                    </p>
                  </div>

                  {/* Interactive Mock Widgets */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      className="px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg"
                      style={{
                        backgroundColor: settings.accentColor,
                        color: ACCENT_PRESETS.find((a) => a.hex.toLowerCase() === settings.accentColor.toLowerCase())?.textContrast || '#000000',
                        boxShadow: `0 0 16px rgba(var(--theme-accent-rgb), 0.4)`,
                      }}
                    >
                      Active Action
                    </button>
                    <span
                      className="px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold border"
                      style={{
                        backgroundColor: 'var(--theme-accent-light)',
                        color: settings.accentColor,
                        borderColor: 'var(--theme-accent-border)',
                      }}
                    >
                      94% HEALTH SCORE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Density & Motion */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-slate-300">UI Density</div>
                <div className="flex gap-3">
                  <button
                    onClick={() => onUpdateSettings({ ...settings, uiDensity: 'comfortable' })}
                    className={`flex-1 p-3 rounded-2xl border text-xs font-mono font-semibold transition ${
                      settings.uiDensity === 'comfortable'
                        ? 'border-slate-400 bg-slate-800 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400'
                    }`}
                    style={
                      settings.uiDensity === 'comfortable'
                        ? { borderColor: settings.accentColor }
                        : {}
                    }
                  >
                    Comfortable (Default)
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ ...settings, uiDensity: 'compact' })}
                    className={`flex-1 p-3 rounded-2xl border text-xs font-mono font-semibold transition ${
                      settings.uiDensity === 'compact'
                        ? 'border-slate-400 bg-slate-800 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400'
                    }`}
                    style={
                      settings.uiDensity === 'compact'
                        ? { borderColor: settings.accentColor }
                        : {}
                    }
                  >
                    Compact (Dense)
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-slate-300">Animations &amp; Transitions</div>
                <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-sans text-slate-300">Interactive counter count-ups &amp; tab slides</span>
                  <input
                    type="checkbox"
                    checked={settings.animationsEnabled}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, animationsEnabled: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-[#d4ff59]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: INGESTION & LIMITS */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'ingestion' && (
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-[#232635] bg-[#14151e] p-6 sm:p-8 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white font-mono">
                Codebase Ingestion Ceiling (ATLAS_MAX_FILES)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Controls the maximum number of source files discovered and mapped into the architecture topology.
              </p>
            </div>

            <div className="space-y-3 p-5 rounded-2xl border border-slate-800 bg-[#0d0e15]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300">Maximum Indexed Files</span>
                <span className="text-sm font-mono font-extrabold text-[#d4ff59]">
                  {settings.atlasMaxFiles.toLocaleString()} files
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="10000"
                step="250"
                value={settings.atlasMaxFiles}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, atlasMaxFiles: parseInt(e.target.value, 10) })
                }
                className="w-full accent-[#d4ff59] bg-slate-800"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>100 files (Tiny microservice)</span>
                <span>5,000 files (Default PRD standard)</span>
                <span>10,000 files (Large monorepo)</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-mono font-bold text-slate-300">Vendor Directories Filtering</div>
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-800 bg-[#0d0e15]">
                <div className="text-xs text-slate-300">
                  Exclude vendor code, node_modules, build artifacts, and submodules from graph topology.
                </div>
                <input
                  type="checkbox"
                  checked={settings.excludeVendor}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, excludeVendor: e.target.checked })
                  }
                  className="h-4 w-4 rounded accent-[#d4ff59]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4: PROFILE & PERSONAS */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'profile' && (
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-[#232635] bg-[#14151e] p-6 sm:p-8 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white font-mono">User Identity &amp; Profile</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize your display identity and default reasoning perspective.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400">Display Name</label>
                <input
                  type="text"
                  value={userProfile.name}
                  onChange={(e) => onUpdateProfile({ ...userProfile, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white focus:border-[#d4ff59] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400">Professional Role</label>
                <input
                  type="text"
                  value={userProfile.role}
                  onChange={(e) => onUpdateProfile({ ...userProfile, role: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white focus:border-[#d4ff59] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400">Avatar Initials</label>
                <input
                  type="text"
                  maxLength={3}
                  value={userProfile.initials}
                  onChange={(e) =>
                    onUpdateProfile({ ...userProfile, initials: e.target.value.toUpperCase() })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white focus:border-[#d4ff59] focus:outline-none uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400">Email Address</label>
                <input
                  type="email"
                  value={userProfile.email}
                  onChange={(e) => onUpdateProfile({ ...userProfile, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white focus:border-[#d4ff59] focus:outline-none"
                />
              </div>
            </div>

            {/* Presets */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-xs font-mono text-slate-400">Quick Identity Presets:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateProfile({
                      name: 'Default User',
                      role: 'System Architect',
                      initials: 'DU',
                      email: 'default.architect@atlas.dev',
                    })
                  }
                  className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-700 transition"
                >
                  Default User (DU)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateProfile({
                      name: 'Lead Principal Dev',
                      role: 'Principal Engineer',
                      initials: 'PD',
                      email: 'lead.dev@atlas.dev',
                    })
                  }
                  className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-700 transition"
                >
                  Principal Dev (PD)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateProfile({
                      name: 'Code Reviewer',
                      role: 'Security Specialist',
                      initials: 'CR',
                      email: 'reviewer@atlas.dev',
                    })
                  }
                  className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-700 transition"
                >
                  Security Reviewer (CR)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 5: DIAGNOSTICS & FACTORY RESET */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'diagnostics' && (
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-[#232635] bg-[#14151e] p-6 sm:p-8 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white font-mono">Platform Health &amp; Diagnostics</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify backend proxy connectivity and perform complete factory resets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-slate-800 bg-[#0d0e15] space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Express Proxy Port</div>
                <div className="text-lg font-mono font-bold text-emerald-400 flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  <span>Port 3000 Active</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-800 bg-[#0d0e15] space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Google Gen AI Status</div>
                <div className="text-lg font-mono font-bold text-white flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-purple-400" />
                  <span>{settings.geminiApiKey ? 'User Key Set' : 'System Key / Standby'}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-800 bg-[#0d0e15] space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Active AST Ingest Engine</div>
                <div className="text-lg font-mono font-bold text-white flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-cyan-400" />
                  <span>C++, TS, Python</span>
                </div>
              </div>
            </div>

            {/* Factory Reset Box */}
            <div className="p-5 rounded-2xl border border-rose-900/40 bg-rose-950/10 space-y-3">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm font-mono">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>Absolute Default Factory Reset</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Resets the entire workspace back to baseline 0 values, clears all custom ingested repositories,
                resets user profile and settings back to default, and sets the active view to Overview.
              </p>
              <button
                type="button"
                onClick={onResetToAbsoluteDefault}
                className="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-mono text-xs font-bold hover:bg-rose-500 transition shadow-lg shadow-rose-900/30"
              >
                Perform Complete Factory Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Success Toast */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-[#0d1512] px-4 py-3 text-xs font-mono font-bold text-emerald-300 shadow-2xl animate-slide-up">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Google AI Studio Key Saved &amp; Activated!</span>
        </div>
      )}

      {/* Theme Applied Toast */}
      {themeToast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs font-mono font-bold shadow-2xl animate-slide-up"
          style={{
            backgroundColor: 'var(--theme-bg-card, #1a1c27)',
            borderColor: settings.accentColor,
            color: settings.accentColor,
            boxShadow: `0 0 25px rgba(var(--theme-accent-rgb), 0.35)`,
          }}
        >
          <Sparkles className="h-4 w-4" style={{ color: settings.accentColor }} />
          <span>{themeToast}</span>
        </div>
      )}
    </div>
  );
};
