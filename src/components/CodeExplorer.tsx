import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FolderCode,
  FileCode,
  Code2,
  GitBranch,
  Copy,
  Check,
  AlertTriangle,
  Layers,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { RepositoryModel, RepoFile } from '../types/atlas';

interface CodeExplorerProps {
  repo: RepositoryModel;
  initialFile?: string;
  initialLine?: number;
  onAnalyzeImpact: (filePath: string) => void;
  onAskAIAboutFile: (filePath: string) => void;
  onFileChange?: (filePath: string) => void;
}

// Tree node interface
interface TreeNode {
  name: string;
  fullPath: string;
  isFolder: boolean;
  children?: TreeNode[];
  file?: RepoFile;
}

export const CodeExplorer: React.FC<CodeExplorerProps> = ({
  repo,
  initialFile,
  initialLine,
  onAnalyzeImpact,
  onAskAIAboutFile,
  onFileChange,
}) => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>(
    initialFile || repo.files[0]?.path || ''
  );

  React.useEffect(() => {
    if (initialFile && repo.fileMap[initialFile]) {
      setSelectedFilePath(initialFile);
    } else if (!repo.fileMap[selectedFilePath] && repo.files.length > 0) {
      setSelectedFilePath(repo.files[0].path);
    }
  }, [repo.id, initialFile]);

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Auto-expand directory hierarchy for the current repo and selected file
  React.useEffect(() => {
    const newExpanded: Record<string, boolean> = {};
    repo.files.forEach((f) => {
      const parts = f.path.split('/');
      if (parts.length > 1) {
        newExpanded[parts[0]] = true;
      }
    });

    if (selectedFilePath) {
      const parts = selectedFilePath.split('/');
      let curr = '';
      for (let i = 0; i < parts.length - 1; i++) {
        curr = curr ? `${curr}/${parts[i]}` : parts[i];
        newExpanded[curr] = true;
      }
    }
    setExpandedFolders((prev) => ({ ...prev, ...newExpanded }));
  }, [repo.id, selectedFilePath]);

  const handleExpandAll = () => {
    const all: Record<string, boolean> = {};
    repo.files.forEach((f) => {
      const parts = f.path.split('/');
      let curr = '';
      for (let i = 0; i < parts.length - 1; i++) {
        curr = curr ? `${curr}/${parts[i]}` : parts[i];
        all[curr] = true;
      }
    });
    setExpandedFolders(all);
  };

  const handleCollapseAll = () => {
    setExpandedFolders({});
  };
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'symbols' | 'imports' | 'dependents'>('symbols');

  // Build hierarchical folder tree
  const treeRoot = useMemo(() => {
    const root: TreeNode = { name: '', fullPath: '', isFolder: true, children: [] };

    repo.files.forEach((file) => {
      const parts = file.path.split('/');
      let curr = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        const currentPath = parts.slice(0, i + 1).join('/');

        if (isLast) {
          curr.children?.push({
            name: part,
            fullPath: currentPath,
            isFolder: false,
            file,
          });
        } else {
          let folderNode = curr.children?.find((c) => c.isFolder && c.name === part);
          if (!folderNode) {
            folderNode = {
              name: part,
              fullPath: currentPath,
              isFolder: true,
              children: [],
            };
            curr.children?.push(folderNode);
          }
          curr = folderNode;
        }
      }
    });

    return root;
  }, [repo.files]);

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const selectedFile = repo.fileMap[selectedFilePath] || repo.files[0];

  const handleCopyCode = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Render tree node recursively
  const renderTree = (node: TreeNode, depth = 0) => {
    if (node.isFolder) {
      const isExpanded = !!expandedFolders[node.fullPath];
      return (
        <div key={node.fullPath || 'root'}>
          {node.name && (
            <button
              onClick={() => toggleFolder(node.fullPath)}
              style={{ paddingLeft: `${depth * 12 + 6}px` }}
              className="flex w-full items-center gap-1.5 py-1 text-left text-xs font-mono text-slate-300 hover:bg-slate-900 rounded transition"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-slate-500" />
              ) : (
                <ChevronRight className="h-3 w-3 text-slate-500" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-3.5 w-3.5 text-indigo-400" />
              ) : (
                <Folder className="h-3.5 w-3.5 text-indigo-400" />
              )}
              <span className="truncate">{node.name}</span>
            </button>
          )}
          {isExpanded && node.children && (
            <div className="space-y-0.5">
              {node.children.map((child) => renderTree(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    const isSelected = selectedFilePath === node.fullPath;
    return (
      <button
        key={node.fullPath}
        onClick={() => {
          setSelectedFilePath(node.fullPath);
          onFileChange?.(node.fullPath);
        }}
        style={{ paddingLeft: `${depth * 12 + 18}px` }}
        className={`flex w-full items-center justify-between py-1 pr-2 text-left text-xs font-mono rounded transition ${
          isSelected
            ? 'bg-indigo-600/20 text-indigo-300 font-semibold border-l-2 border-indigo-500'
            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <FileCode className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
          <span className="truncate">{node.name}</span>
        </div>
        <span className="text-[10px] text-slate-600 font-mono">
          {node.file?.linesCount}L
        </span>
      </button>
    );
  };

  if (repo.files.length === 0) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-slate-950 p-6 text-center animate-fade-in">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 max-w-md space-y-4 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <FolderCode className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white font-mono">No Source Files (Fresh Start)</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              This workspace has 0 files indexed. Ingest a GitHub repository or load demonstration projects to explore hierarchical directory trees, inspect AST symbols, and analyze dependencies.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] bg-slate-950 overflow-hidden">
      {/* 1. File Tree Sidebar */}
      <div className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950 flex flex-col max-h-56 lg:max-h-none">
        <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-xs font-mono font-semibold text-slate-400">
          <span>FILES &amp; TREE</span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <button
              onClick={handleExpandAll}
              className="text-slate-400 hover:text-indigo-300 transition"
              title="Expand All Folders"
            >
              Expand
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={handleCollapseAll}
              className="text-slate-400 hover:text-indigo-300 transition"
              title="Collapse All Folders"
            >
              Collapse
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {treeRoot.children?.map((child) => renderTree(child, 0))}
        </div>
      </div>

      {/* 2. Main Source Code Viewer */}
      <div className="flex-1 flex flex-col bg-slate-900/30 overflow-hidden">
        {/* Code Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-2">
          <div className="flex items-center gap-2 truncate">
            <FileCode className="h-4 w-4 text-indigo-400 shrink-0" />
            <span className="text-xs font-mono font-bold text-white truncate">
              {selectedFile?.path}
            </span>
            <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-400">
              {selectedFile?.moduleCluster}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAskAIAboutFile(selectedFile.path)}
              className="flex items-center gap-1 rounded bg-indigo-950/60 border border-indigo-800/60 px-2.5 py-1 text-xs font-mono text-indigo-300 hover:bg-indigo-900 transition"
              title="Ask AI Assistant to explain this file"
            >
              <Sparkles className="h-3 w-3" />
              <span className="hidden sm:inline">Explain</span>
            </button>

            <button
              onClick={() => onAnalyzeImpact(selectedFile.path)}
              className="flex items-center gap-1 rounded bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 text-xs font-mono text-amber-300 hover:bg-amber-900 transition"
              title="Analyze blast radius if this file is modified"
            >
              <AlertTriangle className="h-3 w-3" />
              <span className="hidden sm:inline">Impact</span>
            </button>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-300 hover:bg-slate-700 transition"
              title="Copy source code to clipboard"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Source Code Lines Viewer */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed bg-slate-950/90 selection:bg-indigo-600/40">
          <table className="w-full border-collapse">
            <tbody>
              {selectedFile?.content.split('\n').map((line, idx) => {
                const lineNum = idx + 1;
                const isTargetLine = initialLine === lineNum;
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-800/50 ${
                      isTargetLine ? 'bg-amber-500/20 font-bold' : ''
                    }`}
                  >
                    <td className="w-10 select-none text-right pr-4 text-slate-600 border-r border-slate-800/60">
                      {lineNum}
                    </td>
                    <td className="pl-4 whitespace-pre">
                      {line || ' '}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Right Inspector Pane */}
      <div className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950 flex flex-col max-h-72 lg:max-h-none">
        {/* Tab switch */}
        <div className="flex border-b border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('symbols')}
            className={`flex-1 py-2 text-center transition border-b-2 ${
              activeTab === 'symbols'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Symbols ({selectedFile?.symbols.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('imports')}
            className={`flex-1 py-2 text-center transition border-b-2 ${
              activeTab === 'imports'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Imports ({selectedFile?.dependencies.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('dependents')}
            className={`flex-1 py-2 text-center transition border-b-2 ${
              activeTab === 'dependents'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Callers ({selectedFile?.dependents.length || 0})
          </button>
        </div>

        {/* Inspector Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeTab === 'symbols' && (
            <div className="space-y-1.5">
              {selectedFile?.symbols.length === 0 ? (
                <div className="text-xs text-slate-500 p-2 text-center">
                  No top-level exported symbols detected.
                </div>
              ) : (
                selectedFile?.symbols.map((sym) => (
                  <div
                    key={sym.id}
                    className="rounded border border-slate-800 bg-slate-900/60 p-2 font-mono text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 truncate">{sym.name}</span>
                      <span className="text-[10px] text-indigo-400 bg-indigo-950/80 px-1.5 py-0.2 rounded uppercase">
                        {sym.kind}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Line {sym.lineStart} - {sym.lineEnd}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'imports' && (
            <div className="space-y-1.5">
              {selectedFile?.dependencies.length === 0 ? (
                <div className="text-xs text-slate-500 p-2 text-center">
                  Zero local dependencies imported.
                </div>
              ) : (
                selectedFile?.dependencies.map((dep) => (
                  <button
                    key={dep}
                    onClick={() => {
                      setSelectedFilePath(dep);
                      onFileChange?.(dep);
                    }}
                    className="w-full text-left rounded border border-slate-800 bg-slate-900/60 p-2 font-mono text-xs text-slate-300 hover:border-slate-700 hover:text-indigo-400 transition flex items-center justify-between"
                  >
                    <span className="truncate">→ {dep.split('/').pop()}</span>
                    <ChevronRight className="h-3 w-3 text-slate-600" />
                  </button>
                ))
              )}
            </div>
          )}

          {activeTab === 'dependents' && (
            <div className="space-y-1.5">
              {selectedFile?.dependents.length === 0 ? (
                <div className="text-xs text-slate-500 p-2 text-center">
                  No files import this component.
                </div>
              ) : (
                selectedFile?.dependents.map((dep) => (
                  <button
                    key={dep}
                    onClick={() => {
                      setSelectedFilePath(dep);
                      onFileChange?.(dep);
                    }}
                    className="w-full text-left rounded border border-slate-800 bg-slate-900/60 p-2 font-mono text-xs text-slate-300 hover:border-slate-700 hover:text-amber-400 transition flex items-center justify-between"
                  >
                    <span className="truncate">← {dep.split('/').pop()}</span>
                    <ChevronRight className="h-3 w-3 text-slate-600" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Quick blast radius trigger card */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/40">
          <button
            onClick={() => onAnalyzeImpact(selectedFile.path)}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500 transition shadow-md shadow-amber-600/20"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Analyze Blast Radius</span>
          </button>
        </div>
      </div>
    </div>
  );
};
