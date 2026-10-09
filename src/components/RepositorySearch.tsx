import React, { useState, useMemo } from 'react';
import {
  Search,
  FileCode,
  ArrowRight,
  Code2,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { RepositoryModel, SearchResult } from '../types/atlas';

interface RepositorySearchProps {
  repo: RepositoryModel;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCode: (filePath: string, line?: number) => void;
}

export const RepositorySearch: React.FC<RepositorySearchProps> = ({
  repo,
  isOpen,
  onClose,
  onNavigateToCode,
}) => {
  const [query, setQuery] = useState('');

  // Semantic & Keyword indexer
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const matches: SearchResult[] = [];

    repo.files.forEach((file) => {
      const p = file.path.toLowerCase();
      const content = file.content.toLowerCase();
      const symbols = file.symbols.map((s) => s.name.toLowerCase());

      let score = 0;
      let matchedLine = 1;
      let matchingSnippet = '';
      let reason = '';
      let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

      // 1. Direct path or symbol name match
      if (p.includes(q) || symbols.some((s) => s.includes(q))) {
        score += 50;
        confidence = 'HIGH';
        reason = `Direct match in file path or declared symbol.`;
      }

      // 2. Semantic query matching
      if (q.includes('auth') || q.includes('login') || q.includes('token') || q.includes('password')) {
        if (file.moduleCluster === 'Auth & Security') {
          score += 40;
          confidence = 'HIGH';
          reason = `Primary module for authentication and token validation.`;
        }
      }

      if (q.includes('order') || q.includes('checkout') || q.includes('payment') || q.includes('stripe')) {
        if (p.includes('order') || p.includes('payment')) {
          score += 45;
          confidence = 'HIGH';
          reason = `Handles checkout pipeline and payment transactions.`;
        }
      }

      if (q.includes('database') || q.includes('query') || q.includes('sql') || q.includes('user repo')) {
        if (file.moduleCluster === 'Database') {
          score += 40;
          confidence = 'HIGH';
          reason = `Direct database access repository.`;
        }
      }

      // 3. Scan code lines for snippet
      const lines = file.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(q)) {
          score += 20;
          matchedLine = i + 1;
          matchingSnippet = lines[i].trim();
          break;
        }
      }

      if (!matchingSnippet && lines.length > 0) {
        matchingSnippet = lines[0].trim();
      }

      if (score > 0) {
        matches.push({
          filePath: file.path,
          fileName: file.name,
          cluster: file.moduleCluster,
          matchingSnippet: matchingSnippet || `// ${file.name}`,
          line: matchedLine,
          reason: reason || `Contains matching code keywords.`,
          confidence: score >= 40 ? 'HIGH' : score >= 20 ? 'MEDIUM' : 'LOW',
          symbols: file.symbols.slice(0, 3).map((s) => s.name),
        });
      }
    });

    matches.sort((a, b) => {
      const confWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return confWeight[b.confidence] - confWeight[a.confidence];
    });

    return matches;
  }, [query, repo.files]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/80 backdrop-blur-md">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]">
        {/* Search Input Box */}
        <div className="flex items-center border-b border-slate-800 px-4 py-3 bg-slate-950/80">
          <Search className="h-4 w-4 text-slate-400 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code, functions, or ask 'Where is authentication handled?'..."
            className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none font-mono"
          />
          <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              Type keywords, filenames, or natural language questions...
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              No matching files or symbols found for "{query}".
            </div>
          ) : (
            results.map((res) => {
              const badgeStyle =
                res.confidence === 'HIGH'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : res.confidence === 'MEDIUM'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700';

              return (
                <div
                  key={res.filePath}
                  onClick={() => {
                    onNavigateToCode(res.filePath, res.line);
                    onClose();
                  }}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-3 hover:border-slate-700 hover:bg-slate-900/60 cursor-pointer transition space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span className="text-xs font-mono font-bold text-slate-200 truncate">
                        {res.filePath}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {res.cluster}
                      </span>
                    </div>

                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase border ${badgeStyle}`}
                    >
                      {res.confidence} CONFIDENCE
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    {res.reason}
                  </div>

                  {res.matchingSnippet && (
                    <pre className="rounded bg-slate-900 p-2 text-[11px] font-mono text-amber-300 overflow-x-auto border border-slate-800/80">
                      <code>{res.matchingSnippet}</code>
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
