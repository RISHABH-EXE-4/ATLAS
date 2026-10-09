import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTabId } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ArchitectureMap } from './components/ArchitectureMap';
import { CodeExplorer } from './components/CodeExplorer';
import { ImpactAnalysis } from './components/ImpactAnalysis';
import { FeatureImpactAnalyzer } from './components/FeatureImpactAnalyzer';
import { AIChat } from './components/AIChat';
import { PullRequestIntel } from './components/PullRequestIntel';
import { OnboardingGuide } from './components/OnboardingGuide';
import { DependenciesView } from './components/DependenciesView';
import { RepositorySearch } from './components/RepositorySearch';
import { IngestModal } from './components/IngestModal';
import { Breadcrumbs } from './components/Breadcrumbs';
import { SettingsView } from './components/SettingsView';
import { SAMPLE_REPOSITORIES } from './data/sampleRepositories';
import { RepositoryModel, PersonaMode, UserProfile, DEFAULT_USER_PROFILE } from './types/atlas';
import { AppSettings, DEFAULT_APP_SETTINGS } from './types/settings';
import { getStoredGeminiApiKey, setStoredGeminiApiKey } from './utils/aiClient';
import { applyThemeToDocument } from './utils/themeEngine';
import { RotateCcw } from 'lucide-react';

export default function App() {
  const [repositories, setRepositories] = useState<RepositoryModel[]>(SAMPLE_REPOSITORIES);
  const [currentRepo, setCurrentRepo] = useState<RepositoryModel>(SAMPLE_REPOSITORIES[0]);
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');
  const [persona, setPersona] = useState<PersonaMode>('architect');
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('atlas_app_settings');
      if (saved) {
        return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {}
    return { ...DEFAULT_APP_SETTINGS, geminiApiKey: getStoredGeminiApiKey() };
  });
  const [resetToast, setResetToast] = useState(false);

  // Apply visual theme and accent across the entire DOM
  useEffect(() => {
    applyThemeToDocument(settings.accentColor || '#d4ff59', settings.themeMode || 'dark');
  }, [settings.accentColor, settings.themeMode]);

  // Sync settings changes to localStorage and aiClient
  useEffect(() => {
    try {
      localStorage.setItem('atlas_app_settings', JSON.stringify(settings));
      setStoredGeminiApiKey(settings.geminiApiKey);
    } catch {}
  }, [settings]);

  // Navigation target states
  const [impactTargetFile, setImpactTargetFile] = useState<string>(SAMPLE_REPOSITORIES[0].files[0]?.path || '');
  const [codeTargetFile, setCodeTargetFile] = useState<string>(SAMPLE_REPOSITORIES[0].files[0]?.path || '');
  const [codeTargetLine, setCodeTargetLine] = useState<number | undefined>(undefined);
  const [chatPrefill, setChatPrefill] = useState<string>('');

  // Modals & Mobile state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handlers for Fresh Start and absolute default reset
  const handleResetToFreshStart = () => {
    const fresh = repositories.find((r) => r.id === 'fresh-start') || SAMPLE_REPOSITORIES[0];
    setCurrentRepo(fresh);
    setImpactTargetFile('');
    setCodeTargetFile('');
    setCodeTargetLine(undefined);
    setActiveTab('overview');
  };

  const handleResetToAbsoluteDefault = () => {
    // 1. Clear local storage
    try {
      localStorage.clear();
    } catch {}
    // 2. Clear stored API key and restore default settings
    setStoredGeminiApiKey('');
    setSettings(DEFAULT_APP_SETTINGS);
    // 3. Reset repositories list to default built-ins (clears any temporary ingested repos)
    setRepositories(SAMPLE_REPOSITORIES);
    // 4. Select Fresh Start repo (0 across all metrics)
    setCurrentRepo(SAMPLE_REPOSITORIES[0]);
    // 5. Reset profile to absolute default
    setUserProfile(DEFAULT_USER_PROFILE);
    // 6. Reset persona
    setPersona('architect');
    // 7. Reset active tab & navigation targets
    setActiveTab('overview');
    setImpactTargetFile('');
    setCodeTargetFile('');
    setCodeTargetLine(undefined);
    setChatPrefill('');
    setMobileMenuOpen(false);

    // 8. Show confirmation toast
    setResetToast(true);
    setTimeout(() => setResetToast(false), 3000);
  };

  const handleLoadSample = (sampleId: string) => {
    const target = repositories.find((r) => r.id === sampleId);
    if (target) {
      setCurrentRepo(target);
      setImpactTargetFile(target.files[0]?.path || '');
      setCodeTargetFile(target.files[0]?.path || '');
      setCodeTargetLine(undefined);
    }
  };

  // Global Keyboard shortcuts: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for cross-component workflows
  const handleNavigateToCode = (filePath: string, line?: number) => {
    setCodeTargetFile(filePath);
    setCodeTargetLine(line);
    setActiveTab('explorer');
    setMobileMenuOpen(false);
  };

  const handleAnalyzeFileImpact = (filePath: string) => {
    setImpactTargetFile(filePath);
    setActiveTab('impact');
    setMobileMenuOpen(false);
  };

  const handleAskAIAboutFile = (filePath: string) => {
    setChatPrefill(`Explain the architectural role and key symbols of ${filePath}.`);
    setActiveTab('chat');
    setMobileMenuOpen(false);
  };

  const handleRepositoryIngested = (newRepo: RepositoryModel, targetTab: string = 'architecture') => {
    setRepositories((prev) => [newRepo, ...prev]);
    setCurrentRepo(newRepo);
    setImpactTargetFile(newRepo.files[0]?.path || '');
    setCodeTargetFile(newRepo.files[0]?.path || '');
    setActiveTab((targetTab as NavTabId) || 'architecture');
  };

  return (
    <div
      className="flex h-screen w-screen bg-[#090a0f] text-slate-100 font-sans overflow-hidden antialiased select-none transition-colors duration-300"
      style={{ backgroundColor: 'var(--theme-bg-app, #090a0f)' }}
    >
      {/* Floating Left Island Dock from Design */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          hotspotsCount={currentRepo.graph.couplingHotspots.length}
          cyclesCount={currentRepo.graph.circularDependencies.length}
        />
      </div>

      {/* Right Column: Navbar, Breadcrumbs & Main Views */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          currentRepo={currentRepo}
          allRepos={repositories}
          onSelectRepo={(repo) => {
            setCurrentRepo(repo);
            setImpactTargetFile(repo.files[0]?.path || '');
            setCodeTargetFile(repo.files[0]?.path || '');
          }}
          persona={persona}
          onChangePersona={setPersona}
          userProfile={userProfile}
          onUpdateProfile={setUserProfile}
          settings={settings}
          onUpdateSettings={setSettings}
          onOpenIngestModal={() => setIsIngestModalOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onResetToFreshStart={handleResetToFreshStart}
          onResetToAbsoluteDefault={handleResetToAbsoluteDefault}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab as NavTabId);
            setMobileMenuOpen(false);
          }}
        />

        {/* Breadcrumb Navigation Trail */}
        <Breadcrumbs
          currentRepo={currentRepo}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          currentFilePath={activeTab === 'impact' ? impactTargetFile : codeTargetFile}
          currentLine={activeTab === 'explorer' ? codeTargetLine : undefined}
          onNavigateToFile={(path) => handleNavigateToCode(path)}
          onAnalyzeImpact={(path) => handleAnalyzeFileImpact(path)}
        />

        {/* Main Content Area */}
        <main
          className="flex-1 overflow-y-auto bg-[#090a0f] transition-colors duration-300"
          style={{ backgroundColor: 'var(--theme-bg-app, #090a0f)' }}
        >
          <div key={activeTab} className="animate-slide-up h-full">
            {activeTab === 'overview' && (
              <Dashboard
                repo={currentRepo}
                onNavigateTab={(tab, extra) => {
                  setActiveTab(tab as NavTabId);
                  if (extra?.filePath) setImpactTargetFile(extra.filePath);
                }}
                onAnalyzeFileImpact={handleAnalyzeFileImpact}
                onOpenIngestModal={() => setIsIngestModalOpen(true)}
                onLoadSample={handleLoadSample}
              />
            )}

            {activeTab === 'architecture' && (
              <ArchitectureMap
                repo={currentRepo}
                onNavigateToCode={handleNavigateToCode}
                onAnalyzeImpact={handleAnalyzeFileImpact}
                onAskAIAboutFile={handleAskAIAboutFile}
              />
            )}

            {activeTab === 'explorer' && (
              <CodeExplorer
                repo={currentRepo}
                initialFile={codeTargetFile}
                initialLine={codeTargetLine}
                onAnalyzeImpact={handleAnalyzeFileImpact}
                onAskAIAboutFile={handleAskAIAboutFile}
                onFileChange={(path) => setCodeTargetFile(path)}
              />
            )}

            {activeTab === 'dependencies' && (
              <DependenciesView
                repo={currentRepo}
                onAnalyzeFileImpact={handleAnalyzeFileImpact}
                onNavigateToCode={handleNavigateToCode}
              />
            )}

            {activeTab === 'impact' && (
              <ImpactAnalysis
                repo={currentRepo}
                initialFile={impactTargetFile}
                onNavigateToCode={handleNavigateToCode}
                onTargetFileChange={(path) => setImpactTargetFile(path)}
              />
            )}

            {activeTab === 'feature-impact' && (
              <FeatureImpactAnalyzer
                repo={currentRepo}
                onNavigateToCode={handleNavigateToCode}
                apiKey={settings.geminiApiKey}
                onNavigateToSettings={() => setActiveTab('settings')}
                onSaveApiKey={(key) => {
                  setStoredGeminiApiKey(key);
                  setSettings({ ...settings, geminiApiKey: key });
                }}
              />
            )}

            {activeTab === 'chat' && (
              <AIChat
                repo={currentRepo}
                persona={persona}
                onChangePersona={setPersona}
                onNavigateToCode={handleNavigateToCode}
                onAnalyzeFileImpact={handleAnalyzeFileImpact}
                prefillQuery={chatPrefill}
                apiKey={settings.geminiApiKey}
                onNavigateToSettings={() => setActiveTab('settings')}
                onSaveApiKey={(key) => {
                  setStoredGeminiApiKey(key);
                  setSettings({ ...settings, geminiApiKey: key });
                }}
              />
            )}

            {activeTab === 'pull-requests' && (
              <PullRequestIntel
                repo={currentRepo}
                onNavigateToCode={handleNavigateToCode}
                apiKey={settings.geminiApiKey}
                onNavigateToSettings={() => setActiveTab('settings')}
                onSaveApiKey={(key) => {
                  setStoredGeminiApiKey(key);
                  setSettings({ ...settings, geminiApiKey: key });
                }}
              />
            )}

            {activeTab === 'onboarding' && (
              <OnboardingGuide
                repo={currentRepo}
                onNavigateToCode={handleNavigateToCode}
                apiKey={settings.geminiApiKey}
                onNavigateToSettings={() => setActiveTab('settings')}
                onSaveApiKey={(key) => {
                  setStoredGeminiApiKey(key);
                  setSettings({ ...settings, geminiApiKey: key });
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={setSettings}
                userProfile={userProfile}
                onUpdateProfile={setUserProfile}
                onResetToAbsoluteDefault={handleResetToAbsoluteDefault}
                onNavigateTab={(tab) => setActiveTab(tab as NavTabId)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/80 backdrop-blur-sm">
          <div
            className="fixed inset-0"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative my-4 ml-4 z-10 flex">
            <Sidebar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                setMobileMenuOpen(false);
              }}
              hotspotsCount={currentRepo.graph.couplingHotspots.length}
              cyclesCount={currentRepo.graph.circularDependencies.length}
            />
          </div>
        </div>
      )}

      {/* Global Search Modal */}
      <RepositorySearch
        repo={currentRepo}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateToCode={handleNavigateToCode}
      />

      {/* Ingest Public GitHub Repo Modal */}
      <IngestModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onRepositoryIngested={handleRepositoryIngested}
      />

      {/* Reset Confirmation Toast */}
      {resetToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-[#0d1512] px-4 py-3 text-xs font-mono font-bold text-emerald-300 shadow-2xl animate-slide-up">
          <RotateCcw className="h-4 w-4 text-emerald-400" />
          <span>✨ Reset to Absolute Default — Clean Slate &amp; Default Profile Initialized!</span>
        </div>
      )}
    </div>
  );
}
