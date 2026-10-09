import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  BotMessageSquare,
  User,
  GraduationCap,
  Code2,
  Building2,
  Loader2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Trash2,
  Zap,
  ArrowRight,
  RotateCcw,
  Terminal,
  Layers,
  ChevronRight,
  GitBranch,
  Key,
  AlertTriangle,
  Brain,
  Download,
  History,
  X,
} from 'lucide-react';
import { RepositoryModel, PersonaMode, ChatMessage } from '../types/atlas';
import { getStoredGeminiApiKey, setStoredGeminiApiKey, getAiHeaders, cleanApiKey } from '../utils/aiClient';

interface AIChatProps {
  repo: RepositoryModel;
  persona: PersonaMode;
  onChangePersona: (persona: PersonaMode) => void;
  onNavigateToCode: (filePath: string, line?: number) => void;
  onAnalyzeFileImpact?: (filePath: string) => void;
  prefillQuery?: string;
  apiKey?: string;
  onNavigateToSettings?: () => void;
  onSaveApiKey?: (key: string) => void;
}

export const AIChat: React.FC<AIChatProps> = ({
  repo,
  persona,
  onChangePersona,
  onNavigateToCode,
  onAnalyzeFileImpact,
  prefillQuery,
  apiKey,
  onNavigateToSettings,
  onSaveApiKey,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState(prefillQuery || '');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCodeSnippet, setCopiedCodeSnippet] = useState<string | null>(null);
  const [inlineKeyInput, setInlineKeyInput] = useState('');
  const [inlineKeySaved, setInlineKeySaved] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeApiKey = (apiKey && apiKey.trim().length > 0 ? apiKey : getStoredGeminiApiKey()).trim();

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyCode = (snippet: string) => {
    navigator.clipboard?.writeText(snippet);
    setCopiedCodeSnippet(snippet);
    setTimeout(() => setCopiedCodeSnippet(null), 2000);
  };

  // Reset infinite memory for current repository
  const handleClearMemory = () => {
    try {
      localStorage.removeItem(`atlas_infinite_memory_${repo.id}`);
    } catch {}

    const langStr = Object.keys(repo.languages).join(', ') || 'Native Code';
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        content: `🧠 **Infinite Memory Cleared.** Starting a fresh conversation session for **${repo.name}** (${langStr}).

Ask any question — from general engineering, math, and concepts to in-depth codebase static analysis!`,
        persona,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'atlas-memory-engine',
      },
    ]);
  };

  // Export full transcript as markdown
  const handleExportChat = () => {
    const text = `# ATLAS Conversation Transcript: ${repo.name}\n\nExported: ${new Date().toLocaleString()}\n\n---\n\n` +
      messages.map((m) => {
        const author = m.role === 'user' ? '👤 **User**' : '⚡ **ATLAS Engine**';
        return `### ${author} (${m.timestamp || ''})\n\n${m.content}\n`;
      }).join('\n---\n\n');

    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlas-memory-${repo.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (prefillQuery) {
      setInputQuery(prefillQuery);
    }
  }, [prefillQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const personaConfig: Record<PersonaMode, { label: string; icon: any; color: string; desc: string }> = {
    beginner: {
      label: 'Beginner',
      icon: GraduationCap,
      color: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
      desc: 'Intuitive analogies like a teacher',
    },
    developer: {
      label: 'Developer',
      icon: Code2,
      color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60',
      desc: 'Technical terminology & execution pipelines',
    },
    architect: {
      label: 'Architect',
      icon: Building2,
      color: 'text-purple-400 bg-purple-950/40 border-purple-800/60',
      desc: 'System boundaries & coupling metrics',
    },
  };

  // Dynamic sample prompts tailored to the loaded repository
  const samplePrompts = useMemo(() => {
    const pList: string[] = [];
    const files = repo.files.map(f => f.path.toLowerCase());

    if (files.some(f => f.includes('relinker') || f.includes('patcher') || f.includes('nid'))) {
      pList.push('Explain the Relinker and NID Patcher architecture.');
    }
    if (files.some(f => f.includes('decoder') || f.includes('jpeg') || f.includes('png'))) {
      pList.push('How does the hardware Decoder subsystem work?');
    }
    if (files.some(f => f.includes('vulkan') || f.includes('gpu') || f.includes('shader'))) {
      pList.push('How does the Vulkan/GPU graphics pipeline operate?');
    }
    if (files.some(f => f.includes('auth') || f.includes('login') || f.includes('session'))) {
      pList.push('Explain how authentication and sessions work.');
    }
    if (files.some(f => f.includes('memory') || f.includes('allocator') || f.includes('vma'))) {
      pList.push('Explain the memory allocation and page table system.');
    }
    if (files.some(f => f.includes('cmake') || f.includes('cmakelists'))) {
      pList.push('What are the main CMake build targets and entry points?');
    }

    // Default essentials
    pList.push('Explain the overall architecture and main entry points.');
    pList.push('Which files have the highest coupling and blast radius?');

    return pList.slice(0, 4);
  }, [repo]);

  // Infinite Memory: Restore persisted conversation on repo change or initialize
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`atlas_infinite_memory_${repo.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {}

    const langStr = Object.keys(repo.languages).join(', ') || 'Native Code';
    setMessages([
      {
        id: `welcome_${repo.id}`,
        role: 'assistant',
        content: `Greetings! I am **ATLAS**, your Project Intelligence Platform & Engineering Partner for **${repo.name}** (${langStr}).

🧠 **Infinite Memory System is Active**: All conversation turns, previous inquiries, and architectural discussions are preserved in persistent memory.

Feel free to ask me anything:
- **Repository Deep-Dives**: *"Trace the execution flow starting from ${repo.entryPoints[0] || 'the main entry point'}"*, *"Which modules have the highest coupling?"*
- **General Inquiries & Math**: Ask algorithmic puzzles, math like *"1 + 1"*, programming concepts, or discuss system architecture.
- **Extended Boundaries**: I assist seamlessly across coding, logic, multi-turn reasoning, and codebase intelligence!`,
        persona,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'atlas-knowledge-graph',
      },
    ]);
  }, [repo.id]);

  // Persist messages whenever updated (Infinite Memory)
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(`atlas_infinite_memory_${repo.id}`, JSON.stringify(messages));
      } catch {}
    }
  }, [messages, repo.id]);

  // Client-side Direct Gemini API caller for static Cloudflare Pages deployments
  const callDirectCloudflareGemini = async (
    userQuery: string,
    historyMessages: ChatMessage[],
    key: string
  ): Promise<{ text: string; source: string }> => {
    const cleanedKey = cleanApiKey(key);
    const systemPrompt = `You are ATLAS — the Project Intelligence Platform & Engineering Partner.
You possess world-class capabilities in software engineering, mathematics, computer science, algorithms, logic, and general knowledge.
Infinite Memory is active: maintain full context across conversation turns.
CRITICAL EXTENDED BOUNDARIES:
- For general questions (math like 1 + 1 = 2, logic, identity, what is your name, greetings, general coding outside this repo), ANSWER DIRECTLY AND CLEARLY. Do NOT refuse.
- For repository questions about ${repo.name} (${repo.fullName || repo.name}): ground claims in the indexed codebase with [path:line] citations.`;

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Filter welcome and error messages from API history
    const validHistory = historyMessages.filter(
      (m) => !m.id.startsWith('welcome_') && !m.id.startsWith('ast_key_err') && !m.id.startsWith('ast_401')
    );

    for (const msg of validHistory) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: userQuery }],
    });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(cleanedKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
        }),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Google AI Studio API responded with HTTP ${res.status}`);
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('No candidate content generated.');
    }

    return { text: candidateText, source: 'gemini-2.5-flash (cloudflare direct)' };
  };

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || isLoading) return;

    const effectiveKey = (activeApiKey || inlineKeyInput.trim()).trim();

    if (!effectiveKey) {
      const userMsg: ChatMessage = {
        id: `usr_${Date.now()}`,
        role: 'user',
        content: q,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const assistantMsg: ChatMessage = {
        id: `ast_key_err_${Date.now()}`,
        role: 'assistant',
        content: `### 🔑 Google AI Studio API Key Required

To protect resources and enable AI repository analysis, a **Google AI Studio API key** is required before executing AI actions.

1. Get your key at **[Google AI Studio (aistudio.google.com/app/apikey)](https://aistudio.google.com/app/apikey)** (supports latest **AQ.Ab...** and classic **AIzaSy...** formats).
2. Paste it in the **Google AI Key** banner above or click **Settings** to save it permanently.
3. Once configured, Infinite Memory retains all your questions, architectural deep dives, and system simulations!`,
        persona,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'atlas-access-control',
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInputQuery('');
      return;
    }

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Keep history snapshot before appending user query
    const previousHistory = [...messages];
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Gather relevant graph facts across top files
      const graphFacts = repo.files.slice(0, 35).map((f) => ({
        path: f.path,
        cluster: f.moduleCluster,
        symbols: f.symbols.slice(0, 8).map((s) => s.name),
        imports: f.imports.slice(0, 8).map((i) => i.resolvedTarget || i.targetRaw),
        lines: f.linesCount,
      }));

      // Filter history for infinite memory payload
      const conversationHistory = previousHistory
        .filter((m) => !m.id.startsWith('welcome_') && !m.id.startsWith('ast_key_err') && !m.id.startsWith('ast_401'))
        .map((m) => ({ role: m.role, content: m.content }));

      let reply = '';
      let source = 'gemini';

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: getAiHeaders(effectiveKey),
          body: JSON.stringify({
            query: q,
            persona,
            apiKey: effectiveKey,
            conversationHistory,
            repoContext: {
              name: repo.name,
              fullName: repo.fullName,
              description: repo.description,
              languages: repo.languages,
              frameworks: repo.frameworks,
              entryPoints: repo.entryPoints,
              files: repo.files.map((f) => f.path),
              clusters: Object.entries(repo.graph.clusters).reduce((acc: any, [k, v]) => {
                if (v.length > 0) acc[k] = v;
                return acc;
              }, {}),
            },
            graphFacts,
          }),
        });

        if (res.status === 401) {
          const data = await res.json().catch(() => ({}));
          const assistantMsg: ChatMessage = {
            id: `ast_401_${Date.now()}`,
            role: 'assistant',
            content: `⚠️ **Authentication Error**: ${data.error || 'Google AI Studio API Key is required or invalid.'}\n\nPlease check your key in Settings or obtain a fresh one from [Google AI Studio](https://aistudio.google.com/app/apikey).`,
            persona,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: 'security-boundary',
          };
          setMessages((prev) => [...prev, assistantMsg]);
          return;
        }

        if (res.ok) {
          const data = await res.json();
          reply = data.reply || 'Analysis completed.';
          source = data.source || 'gemini-2.5-flash';
        } else if (res.status === 404) {
          // Fallback for static Cloudflare Pages deployment (no Express server route)
          const direct = await callDirectCloudflareGemini(q, previousHistory, effectiveKey);
          reply = direct.text;
          source = direct.source;
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error || `HTTP ${res.status}`);
        }
      } catch (networkOrEndpointErr: any) {
        // If Express route failed or was unreachable, try direct Cloudflare call
        try {
          const direct = await callDirectCloudflareGemini(q, previousHistory, effectiveKey);
          reply = direct.text;
          source = direct.source;
        } catch (directErr: any) {
          throw networkOrEndpointErr;
        }
      }

      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: reply,
        persona,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ast_err_${Date.now()}`,
          role: 'assistant',
          content: `I encountered an issue processing this query: ${err?.message || 'Network error'}. Please verify your API key in Settings.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render inline text with citation badges [path:line] and bolding
  const renderInlineFormattedText = (rawText: string) => {
    // Regex for citations: [path:line] or [path]
    const citationRegex = /\[([A-Za-z0-9_\-\./]+(?:\.[a-z0-9]+)?)(?::(\d+))?\]/g;
    const segments: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = citationRegex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        segments.push(renderBoldAndCode(rawText.substring(lastIndex, match.index)));
      }

      const filePath = match[1];
      const lineNum = match[2] ? parseInt(match[2], 10) : undefined;
      const fileExists = !!repo.fileMap[filePath];

      segments.push(
        <span
          key={`cit-${match.index}-${filePath}`}
          className="inline-flex items-center gap-1 mx-1 my-0.5 align-middle"
        >
          <button
            onClick={() => fileExists && onNavigateToCode(filePath, lineNum)}
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-mono font-medium transition ${
              fileExists
                ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 hover:bg-indigo-900 hover:text-white cursor-pointer shadow-sm'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
            title={fileExists ? `Inspect ${filePath}${lineNum ? ` line ${lineNum}` : ''}` : 'Module citation'}
          >
            <span>{filePath.split('/').pop()}{lineNum ? `:${lineNum}` : ''}</span>
            {fileExists && <ExternalLink className="h-2.5 w-2.5 opacity-70" />}
          </button>
          {fileExists && onAnalyzeFileImpact && (
            <button
              onClick={() => onAnalyzeFileImpact(filePath)}
              className="rounded-md bg-amber-950/50 border border-amber-800/60 px-1 py-0.5 text-[10px] font-mono text-amber-300 hover:bg-amber-900 transition"
              title={`Analyze blast radius for ${filePath}`}
            >
              <Zap className="h-2.5 w-2.5 inline fill-amber-400 text-amber-400" />
            </button>
          )}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < rawText.length) {
      segments.push(renderBoldAndCode(rawText.substring(lastIndex)));
    }

    return segments;
  };

  // Helper for bold text (**word**) and inline code (`code`)
  const renderBoldAndCode = (textChunk: string) => {
    const parts = textChunk.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={idx}
            className="rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-[11.5px] text-cyan-300 border border-slate-700/60"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Full rich Markdown renderer for message bodies
  const renderRichMarkdown = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer: string[] = [];

    lines.forEach((line, lineIdx) => {
      // Code block start / end
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.trim().slice(3).trim() || 'text';
          codeBuffer = [];
        } else {
          inCodeBlock = false;
          const fullCode = codeBuffer.join('\n');
          const isDiagram = codeLanguage === 'mermaid' || codeLanguage === 'text' && fullCode.includes('──►') || fullCode.includes('➔');

          elements.push(
            <div
              key={`code-${lineIdx}`}
              className="my-3 rounded-xl border border-slate-800 bg-[#0c0d14] overflow-hidden shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/70 px-3.5 py-1.5 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Terminal className="h-3 w-3 text-indigo-400" />
                  <span className="font-semibold uppercase text-indigo-300">{codeLanguage}</span>
                  {isDiagram && (
                    <span className="rounded bg-purple-500/20 px-1.5 py-0.2 text-[9px] text-purple-300 ml-1">
                      EXECUTION FLOW
                    </span>
                  )}
                </span>
                <button
                  onClick={() => handleCopyCode(fullCode)}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition"
                  title="Copy code snippet"
                >
                  {copiedCodeSnippet === fullCode ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre leading-relaxed bg-[#0a0c13]">
                {fullCode}
              </pre>
            </div>
          );
          codeBuffer = [];
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      // Headers ### or ## or #
      if (line.startsWith('### ')) {
        elements.push(
          <div key={`h3-${lineIdx}`} className="mt-4 mb-2 flex items-center gap-2 pt-2 border-t border-slate-800/60 first:border-0 first:pt-0">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            <h3 className="text-sm sm:text-base font-bold text-white font-mono tracking-wide">
              {renderInlineFormattedText(line.slice(4))}
            </h3>
          </div>
        );
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <div key={`h2-${lineIdx}`} className="mt-4 mb-2">
            <h2 className="text-base font-extrabold text-white font-mono flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>{renderInlineFormattedText(line.slice(3))}</span>
            </h2>
          </div>
        );
        return;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${lineIdx}`} className="mt-3 mb-2 text-lg font-black text-white font-mono">
            {renderInlineFormattedText(line.slice(2))}
          </h1>
        );
        return;
      }

      // Bullet lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const itemText = line.trim().slice(2);
        elements.push(
          <div key={`li-${lineIdx}`} className="flex items-start gap-2.5 my-1 text-slate-300">
            <span className="text-indigo-400 text-xs mt-1 shrink-0">•</span>
            <div className="flex-1 leading-relaxed">
              {renderInlineFormattedText(itemText)}
            </div>
          </div>
        );
        return;
      }

      // Numbered lists e.g. "1. "
      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        elements.push(
          <div key={`num-${lineIdx}`} className="flex items-start gap-2.5 my-1 text-slate-300">
            <span className="rounded bg-indigo-950/80 border border-indigo-800/60 px-1.5 py-0.5 text-[10px] font-mono text-indigo-300 shrink-0 font-bold mt-0.5">
              {numMatch[1]}
            </span>
            <div className="flex-1 leading-relaxed">
              {renderInlineFormattedText(numMatch[2])}
            </div>
          </div>
        );
        return;
      }

      // Empty line spacer
      if (!line.trim()) {
        elements.push(<div key={`sp-${lineIdx}`} className="h-2" />);
        return;
      }

      // Standard paragraph line
      elements.push(
        <p key={`p-${lineIdx}`} className="my-1 text-slate-300 leading-relaxed">
          {renderInlineFormattedText(line)}
        </p>
      );
    });

    return elements;
  };

  // Follow-up suggestions based on repository state
  const followUpSuggestions = useMemo(() => {
    return [
      `Analyze blast radius of ${repo.entryPoints[0]?.split('/').pop() || 'core module'}`,
      `Show coupling hotspots in ${repo.name}`,
      `Explain data structures and memory boundaries`,
    ];
  }, [repo]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-slate-950 max-w-5xl mx-auto p-3 sm:p-6">
      {/* Header with Persona Switcher */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <BotMessageSquare className="h-4 w-4" />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
              <span>ATLAS Codebase Intelligence</span>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono text-indigo-300 border border-indigo-500/30">
                {repo.name}
              </span>
            </h1>
            <span className="hidden sm:inline-flex rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
              GROUNDED IN GRAPH
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Strictly reasons over {repo.files.length} indexed files with verified citations.
          </p>
        </div>

        {/* Persona toggle tabs & Action buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-1 gap-1">
            {(['beginner', 'developer', 'architect'] as PersonaMode[]).map((p) => {
              const cfg = personaConfig[p];
              const Icon = cfg.icon;
              const isCurrent = persona === p;
              return (
                <button
                  key={p}
                  onClick={() => onChangePersona(p)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono font-medium transition ${
                    isCurrent
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={cfg.desc}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{cfg.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleClearMemory}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
            title="Reset Chat & Memory"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Infinite Memory Status & Action Bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-[#14151e] to-slate-900/60 p-2.5 px-3.5 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Brain className="h-4 w-4 animate-pulse" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs font-mono">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <span>Infinite Memory Active</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="text-slate-300 text-[11px]">
              {messages.filter((m) => m.role === 'user').length} conversational {messages.filter((m) => m.role === 'user').length === 1 ? 'turn' : 'turns'} retained across sessions
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowMemoryModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-800/60 bg-cyan-950/40 px-2.5 py-1 text-[11px] font-mono text-cyan-300 hover:bg-cyan-900/60 transition cursor-pointer"
            title="Inspect what ATLAS currently remembers"
          >
            <History className="h-3 w-3" />
            <span className="hidden sm:inline">Memory Inspector</span>
            <span className="sm:hidden">Memory</span>
          </button>

          <button
            onClick={handleExportChat}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
            title="Download full conversation transcript as Markdown (.md)"
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={handleClearMemory}
            className="flex items-center gap-1.5 rounded-lg border border-rose-900/40 bg-rose-950/30 px-2.5 py-1 text-[11px] font-mono text-rose-300 hover:bg-rose-900/50 transition cursor-pointer"
            title="Clear stored memory and start fresh"
          >
            <Trash2 className="h-3 w-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Memory Inspector Modal */}
      {showMemoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-[#12141e] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold text-white">ATLAS Working Memory Inspector</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Real-time persistent state for {repo.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowMemoryModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <span className="text-[10px] uppercase text-slate-400 block">Repository Context</span>
                  <span className="font-bold text-slate-200 mt-1 block truncate">{repo.name}</span>
                  <span className="text-[10px] text-cyan-400">{repo.files.length} indexed files</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <span className="text-[10px] uppercase text-slate-400 block">Active Persona</span>
                  <span className="font-bold text-slate-200 mt-1 block capitalize">{persona}</span>
                  <span className="text-[10px] text-emerald-400">Contextual Prompt Active</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-slate-400">Stored Dialogue Turns</span>
                  <span className="text-[10px] font-bold text-cyan-400">{messages.length} messages</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {messages.slice(-6).map((m, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] p-1.5 rounded bg-slate-950/60 border border-slate-800/60">
                      <span className={`px-1 rounded text-[9px] font-bold ${m.role === 'user' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {m.role === 'user' ? 'USER' : 'ATLAS'}
                      </span>
                      <span className="text-slate-300 truncate flex-1">{m.content.slice(0, 75)}...</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-3 text-[11px] text-cyan-200 leading-relaxed">
                💡 <strong>Infinite Memory Guarantee</strong>: All conversational turns are persisted in local storage under <code>atlas_infinite_memory_{repo.id}</code> and injected into subsequent multi-turn Gemini completions, guaranteeing ATLAS never forgets your questions, discussions, or preferences.
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  handleClearMemory();
                  setShowMemoryModal(false);
                }}
                className="text-xs font-mono text-rose-400 hover:text-rose-300 transition cursor-pointer"
              >
                Clear Memory
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportChat}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-mono text-slate-200 hover:bg-slate-700 transition cursor-pointer"
                >
                  Export Transcript
                </button>
                <button
                  onClick={() => setShowMemoryModal(false)}
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-3.5 py-1.5 text-xs font-mono font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google AI Studio API Key Banner (Required for AI actions) */}
      {!activeApiKey && (
        <div className="mb-3 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-[#14151e] to-[#14151e] p-3.5 sm:p-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Key className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-mono font-bold text-amber-300">
                  Google AI Studio API Key Required
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Connect your key from Google AI Studio to perform grounded AI reasoning over this codebase.
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
                <span>Get API Key</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              {onNavigateToSettings && (
                <button
                  onClick={onNavigateToSettings}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-mono text-slate-200 hover:bg-slate-700 transition"
                >
                  Settings
                </button>
              )}
            </div>
          </div>
          <div className="mt-2.5 flex gap-2">
            <input
              type="password"
              value={inlineKeyInput}
              onChange={(e) => setInlineKeyInput(e.target.value)}
              placeholder="Paste Google AI Studio Key (AQ.Ab... or AIzaSy...)"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:border-[#d4ff59] focus:outline-none"
            />
            <button
              onClick={() => {
                const cleaned = inlineKeyInput.trim().replace(/^["']|["']$/g, '');
                if (cleaned) {
                  setStoredGeminiApiKey(cleaned);
                  onSaveApiKey?.(cleaned);
                  setInlineKeySaved(true);
                  setTimeout(() => setInlineKeySaved(false), 2500);
                }
              }}
              disabled={!inlineKeyInput.trim()}
              className="rounded-xl bg-[#d4ff59] px-4 py-1.5 text-xs font-mono font-bold text-black hover:opacity-90 disabled:opacity-40 transition"
            >
              {inlineKeySaved ? 'Activated!' : 'Save & Activate'}
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 sm:pr-2">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mt-1">
                  <BotMessageSquare className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white font-sans shadow-md'
                    : 'bg-[#0e121e] border border-slate-800/90 text-slate-200 shadow-xl'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-2.5 text-[10px] font-mono opacity-80 pb-1.5 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      {isUser ? 'You' : `ATLAS (${msg.persona?.toUpperCase() || 'ENGINE'})`}
                    </span>
                    {!isUser && (
                      <span className="rounded bg-indigo-500/10 px-1.5 py-0.2 text-[9px] text-indigo-400 border border-indigo-500/20">
                        {msg.source || 'gemini-3.1-flash-lite'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="rounded p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="font-sans">
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    renderRichMarkdown(msg.content)
                  )}
                </div>

                {/* Quick follow-ups below assistant message */}
                {!isUser && msg.id !== 'welcome' && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5 text-[10.5px] font-mono">
                    <span className="text-slate-500">Related:</span>
                    {followUpSuggestions.map((fu, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(fu)}
                        className="rounded-md border border-slate-800 bg-slate-900/60 px-2 py-0.5 text-slate-300 hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white transition flex items-center gap-1"
                      >
                        <span>{fu}</span>
                        <ChevronRight className="h-2.5 w-2.5 text-slate-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 mt-1 border border-slate-700">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 items-center text-xs font-mono text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 w-fit">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            </div>
            <span>Synthesizing repository intelligence &amp; symbol graphs...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="pt-2 pb-1.5 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-mono text-slate-500">Quick Prompts:</span>
        {samplePrompts.map((p) => (
          <button
            key={p}
            onClick={() => handleSend(p)}
            className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:border-indigo-500/50 hover:bg-slate-900 hover:text-white transition flex items-center gap-1"
          >
            <Zap className="h-3 w-3 text-indigo-400" />
            <span>{p}</span>
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="mt-1 flex gap-2">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Ask ATLAS about ${repo.name} architecture, pipelines, or code...`}
          className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !inputQuery.trim()}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-mono font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50 shadow-md shadow-indigo-600/20"
        >
          <span>Ask</span>
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
