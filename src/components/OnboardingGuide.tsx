import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  FileCode,
  ArrowRight,
  Sparkles,
  Loader2,
  Terminal,
  Layers,
  Database,
  Lock,
  Wrench,
  Key,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { RepositoryModel, OnboardingGuide as OnboardingGuideType } from '../types/atlas';
import { getStoredGeminiApiKey, setStoredGeminiApiKey, getAiHeaders } from '../utils/aiClient';

interface OnboardingGuideProps {
  repo: RepositoryModel;
  onNavigateToCode: (filePath: string) => void;
  apiKey?: string;
  onNavigateToSettings?: () => void;
  onSaveApiKey?: (key: string) => void;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
  repo,
  onNavigateToCode,
  apiKey,
  onNavigateToSettings,
  onSaveApiKey,
}) => {
  const [guide, setGuide] = useState<OnboardingGuideType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [inlineKeyInput, setInlineKeyInput] = useState('');
  const [inlineKeySaved, setInlineKeySaved] = useState(false);
  const activeApiKey = (apiKey && apiKey.trim().length > 0 ? apiKey : getStoredGeminiApiKey()).trim();

  const fetchGuide = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/onboarding', {
        method: 'POST',
        headers: getAiHeaders(activeApiKey),
        body: JSON.stringify({
          apiKey: activeApiKey,
          repoContext: {
            name: repo.name,
            languages: repo.languages,
            files: repo.files.map(f => f.path),
          },
          graphSummary: {
            topModules: Object.keys(repo.graph.clusters),
            totalFiles: repo.files.length,
          },
        }),
      });

      const data = await res.json();
      if (data.guide) {
        setGuide(data.guide);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (repo.files.length === 0) {
      setGuide({
        title: 'WELCOME TO YOUR FRESH ATLAS WORKSPACE',
        sections: [
          {
            step: 1,
            title: 'Initialize Codebase Knowledge Graph',
            content: 'Use the Ingest Modal (⌘K or top navigation) to connect a public GitHub repository. ATLAS will parse the AST, resolve imports, and construct an interactive dependency graph. You can also switch to demo codebases like NexusCommerce or TaskFlow Engine from the repository selector.',
            relevantFiles: []
          },
          {
            step: 2,
            title: 'Explore System Architecture Tiers',
            content: 'Navigate to the Architecture Map to inspect subsystem tiers (Frontend, API Layer, Auth & Security, Services, Database, Configuration, and Utilities). Export the complete topology as an SVG or PNG diagram at any time.',
            relevantFiles: []
          },
          {
            step: 3,
            title: 'Verify Change Blast Radius',
            content: 'Before committing changes or submitting a PR, run "What Breaks If I Change This?" to trace afferent callers, transitive dependents, and code evidence. Instantly prevents silent breaking changes in shared contracts.',
            relevantFiles: []
          }
        ]
      });
      return;
    }
    fetchGuide();
  }, [repo]);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Google AI Studio API Key Banner for Custom Ingested Repos */}
      {repo.files.length > 0 && !activeApiKey && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-[#14151e] to-[#14151e] p-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Key className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-mono font-bold text-amber-300">
                  Google AI Studio API Key Recommended for Custom Synthesis
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  AI-powered tailored onboarding workflows are accelerated when a Google AI Studio API key is provided.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-mono text-purple-300 hover:text-white underline"
              >
                <span>Get Free Key</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              {onNavigateToSettings && (
                <button
                  onClick={onNavigateToSettings}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-mono text-slate-200 hover:bg-slate-700 transition"
                >
                  Open Settings
                </button>
              )}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="password"
              value={inlineKeyInput}
              onChange={(e) => setInlineKeyInput(e.target.value)}
              placeholder="Paste Google AI Studio API Key (AQ.Ab... or AIzaSy...)"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={() => {
                const cleaned = inlineKeyInput.trim().replace(/^["']|["']$/g, '');
                if (cleaned) {
                  setStoredGeminiApiKey(cleaned);
                  onSaveApiKey?.(cleaned);
                  setInlineKeySaved(true);
                  setTimeout(() => setInlineKeySaved(false), 2500);
                  fetchGuide();
                }
              }}
              disabled={!inlineKeyInput.trim()}
              className="rounded-xl bg-[#d4ff59] px-4 py-1.5 text-xs font-mono font-bold text-black hover:opacity-90 disabled:opacity-40 transition"
            >
              {inlineKeySaved ? 'Activated!' : 'Save & Refresh'}
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-400 border border-indigo-500/30">
              DEVELOPER ONBOARDING
            </span>
            <span className="text-xs font-mono text-slate-400">
              11-Step Codebase Briefing
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-mono flex items-center gap-2.5">
            <BookOpen className="h-6 w-6 text-indigo-400" />
            {guide?.title || `WELCOME TO ${repo.name.toUpperCase()}`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
            Accelerate your first day on the project. Grounded architectural map, execution flows, and key file pointers.
          </p>
        </div>

        <button
          onClick={fetchGuide}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          <span>Regenerate Guide</span>
        </button>
      </div>

      {isLoading && !guide && (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-400 font-mono text-xs">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          <span>Synthesizing onboarding guide for {repo.name}...</span>
        </div>
      )}

      {guide && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left step index menu */}
          <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-1 max-h-[650px] overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Onboarding Chapters
            </div>
            {guide.sections.map((section) => (
              <button
                key={section.step}
                onClick={() => setActiveStep(section.step)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-mono transition ${
                  activeStep === section.step
                    ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/40'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                    {section.step}
                  </span>
                  <span className="truncate">{section.title}</span>
                </div>
                <ArrowRight className="h-3 w-3 shrink-0 opacity-60" />
              </button>
            ))}
          </div>

          {/* Right Detailed Chapter Content */}
          <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            {(() => {
              const currentSection =
                guide.sections.find((s) => s.step === activeStep) || guide.sections[0];
              return (
                <div className="space-y-6">
                  <div className="border-b border-slate-800 pb-4">
                    <div className="text-xs font-mono text-indigo-400 font-bold">
                      CHAPTER {currentSection.step} OF {guide.sections.length}
                    </div>
                    <h2 className="text-xl font-bold text-white font-mono mt-1">
                      {currentSection.title}
                    </h2>
                  </div>

                  {/* Section Content */}
                  <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                    {currentSection.content}
                  </div>

                  {/* Clickable Relevant Files */}
                  {currentSection.relevantFiles && currentSection.relevantFiles.length > 0 && (
                    <div className="pt-4 border-t border-slate-800 space-y-2.5">
                      <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileCode className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Key Repository Files:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentSection.relevantFiles.map((f) => {
                          const exists = !!repo.fileMap[f];
                          return (
                            <button
                              key={f}
                              onClick={() => exists && onNavigateToCode(f)}
                              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-mono transition ${
                                exists
                                  ? 'border-indigo-800/60 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/60 hover:text-white cursor-pointer'
                                  : 'border-slate-800 bg-slate-950 text-slate-400'
                              }`}
                            >
                              <FileCode className="h-3.5 w-3.5 text-indigo-400" />
                              <span>{f}</span>
                              {exists && <ArrowRight className="h-3 w-3" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Navigation Footer */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-800 text-xs font-mono">
                    <button
                      onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
                      disabled={activeStep === 1}
                      className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
                    >
                      ← Previous Chapter
                    </button>
                    <button
                      onClick={() => setActiveStep((s) => Math.min(guide.sections.length, s + 1))}
                      disabled={activeStep === guide.sections.length}
                      className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-30"
                    >
                      Next Chapter →
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
