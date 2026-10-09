import {
  RepoFile,
  CodeSymbol,
  ImportRelation,
  ModuleCluster,
  RepositoryModel,
} from '../types/atlas';
import {
  inferModuleCluster,
  extractSymbolsFromContent,
  extractImportsFromContent,
  buildKnowledgeGraph,
} from './analyzer';

export interface IdentifiedEntryPoint {
  path: string;
  name: string;
  category: 'PRIMARY' | 'BUILD' | 'API_ROUTER' | 'KERNEL_RUNTIME';
  label: string;
  confidence: 'HIGH' | 'MEDIUM';
}

export interface SyntheticPipelineReport {
  repositoryName: string;
  totalTreeBlobs: number;
  totalIndexedModules: number;
  realFilesCount: number;
  syntheticModulesCount: number;
  entryPoints: IdentifiedEntryPoint[];
  clusterBreakdown: Record<ModuleCluster, number>;
  keySubsystems: Array<{ name: string; cluster: ModuleCluster; purpose: string; fileCount: number }>;
}

/**
 * Identifies core entry points and bootstrap files across languages and paradigms
 */
export function identifyCoreEntryPoints(
  allPaths: string[],
  primaryLanguage?: string
): IdentifiedEntryPoint[] {
  const entryPoints: IdentifiedEntryPoint[] = [];
  const lowerLang = (primaryLanguage || '').toLowerCase();

  for (const p of allPaths) {
    const lower = p.toLowerCase();
    const base = p.split('/').pop()?.toLowerCase() || '';

    // 1. Build & Project Orchestration
    if (base === 'cmakelists.txt' && !p.includes('/')) {
      entryPoints.push({
        path: p,
        name: p.split('/').pop() || p,
        category: 'BUILD',
        label: 'CMake Root Build Orchestrator',
        confidence: 'HIGH',
      });
      continue;
    }
    if (base === 'package.json' && !p.includes('/')) {
      entryPoints.push({
        path: p,
        name: p.split('/').pop() || p,
        category: 'BUILD',
        label: 'Node.js Package Manifest & Scripts',
        confidence: 'HIGH',
      });
      continue;
    }
    if (base === 'cargo.toml' && !p.includes('/')) {
      entryPoints.push({
        path: p,
        name: p.split('/').pop() || p,
        category: 'BUILD',
        label: 'Rust Cargo Crate Manifest',
        confidence: 'HIGH',
      });
      continue;
    }
    if (base === 'go.mod' && !p.includes('/')) {
      entryPoints.push({
        path: p,
        name: p.split('/').pop() || p,
        category: 'BUILD',
        label: 'Go Module Definition',
        confidence: 'HIGH',
      });
      continue;
    }

    // 2. Primary Execution Entries
    if (
      lower === 'main.cpp' ||
      lower === 'src/main.cpp' ||
      lower === 'core/main.cpp' ||
      lower.endsWith('/main.cpp')
    ) {
      entryPoints.push({
        path: p,
        name: p.split('/').pop() || p,
        category: 'PRIMARY',
        label: 'Native C++ Application Entry Point',
        confidence: 'HIGH',
      });
      continue;
    }
    if (
      lower === 'main.py' ||
      lower === 'app.py' ||
      lower === 'src/main.py' ||
      lower === 'app/main.py' ||
      lower === 'manage.py' ||
      lower === '__main__.py'
    ) {
      entryPoints.push({
        path: p,
        name: p.split('/').pop() || p,
        category: 'PRIMARY',
        label: 'Python Runtime / Service Entry Point',
        confidence: 'HIGH',
      });
      continue;
    }
    if (
      lower === 'src/main.tsx' ||
      lower === 'src/index.tsx' ||
      lower === 'src/main.ts' ||
      lower === 'src/index.ts' ||
      lower === 'src/app.tsx' ||
      lower === 'server.ts' ||
      lower === 'index.js'
    ) {
      entryPoints.push({
        path: p,
        name: p.split('/').pop() || p,
        category: 'PRIMARY',
        label: 'TypeScript / Node.js Bootstrap Entry',
        confidence: 'HIGH',
      });
      continue;
    }
    if (lower === 'src/main.rs' || lower === 'src/lib.rs') {
      entryPoints.push({
        path: p,
        name: p.split('/').pop() || p,
        category: 'PRIMARY',
        label: 'Rust Binary Root / Library Root',
        confidence: 'HIGH',
      });
      continue;
    }
    if (lower === 'main.go' || lower.startsWith('cmd/') && lower.endsWith('main.go')) {
      entryPoints.push({
        path: p,
        name: p.split('/').pop() || p,
        category: 'PRIMARY',
        label: 'Go Command Daemon Entry Point',
        confidence: 'HIGH',
      });
      continue;
    }

    // 3. API Routers and Runtime Engines
    if (
      lower.includes('router') && (lower.endsWith('.ts') || lower.endsWith('.py') || lower.endsWith('.js')) ||
      lower.includes('routes/api') ||
      lower.includes('controllers/auth') ||
      lower.includes('hle/kernel') ||
      lower.includes('decoder/jpeg') && lower.endsWith('.hpp') ||
      lower.includes('binarypatcherfactory') && lower.endsWith('.hpp')
    ) {
      entryPoints.push({
        path: p,
        name: p.split('/').pop() || p,
        category: 'API_ROUTER',
        label: 'Subsystem Dispatcher / Interface Contract',
        confidence: 'MEDIUM',
      });
    }
  }

  // Deduplicate and prioritize primary entry points
  const seen = new Set<string>();
  const unique = entryPoints.filter(ep => {
    if (seen.has(ep.path)) return false;
    seen.add(ep.path);
    return true;
  });

  return unique.slice(0, 8);
}

/**
 * Generates an accurate synthetic purpose description for any file in a codebase
 */
export function generateSyntheticPurpose(filePath: string, cluster: ModuleCluster): string {
  const lower = filePath.toLowerCase();
  const name = filePath.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Module';

  // Specific domain matches
  if (lower.includes('patcher') || lower.includes('relinker') || lower.includes('nid')) {
    return 'Binary NID symbol resolution, dynamic patching, and ELF relocation translation.';
  }
  if (lower.includes('decoder') || lower.includes('jpeg') || lower.includes('png') || lower.includes('audio')) {
    return 'Hardware-accelerated media decoding, format stream decompression, and surface rendering.';
  }
  if (lower.includes('vulkan') || lower.includes('gpu') || lower.includes('shader') || lower.includes('glsl')) {
    return 'Graphics pipeline rendering, GPU hardware abstraction, and Vulkan command buffering.';
  }
  if (lower.includes('memory') || lower.includes('allocator') || lower.includes('vma')) {
    return 'Host and virtual memory allocation, page table mapping, and buffer management.';
  }
  if (lower.includes('hle') || lower.includes('syscall') || lower.includes('kernel') || lower.includes('thread')) {
    return 'High-Level Emulation (HLE) kernel service dispatch, IPC handling, and thread scheduling.';
  }
  if (lower.includes('auth') || lower.includes('jwt') || lower.includes('session')) {
    return 'User credential verification, cryptographic token issuance, and session guards.';
  }
  if (lower.includes('controller') || lower.includes('route') || lower.includes('api')) {
    return 'HTTP/RPC ingress dispatch, request schema validation, and service orchestration.';
  }
  if (lower.includes('repository') || lower.includes('model') || lower.includes('schema') || lower.includes('db')) {
    return 'Data persistence mapping, relational database transactions, and schema serialization.';
  }
  if (lower.includes('service') || lower.includes('engine') || lower.includes('logic')) {
    return 'Core business domain workflow execution, state mutations, and business rule enforcement.';
  }
  if (lower.includes('cmake') || lower.includes('makefile') || lower.includes('config')) {
    return 'Build target declaration, compiler flag configuration, and external dependency linkage.';
  }
  if (lower.includes('log') || lower.includes('util') || lower.includes('helper')) {
    return 'Common diagnostics, cross-module helper utilities, and logging infrastructure.';
  }

  // Fallbacks by architectural cluster
  switch (cluster) {
    case 'Frontend':
      return `Presentation layer module: renders visual interface and UI state for ${name}.`;
    case 'API Layer':
      return `Ingress interface: manages dispatch protocol and endpoint routing for ${name}.`;
    case 'Auth & Security':
      return `Security barrier: controls permissions, cryptographic integrity, and access policies for ${name}.`;
    case 'Services':
      return `Domain service: encapsulates core operational logic and algorithmic pipelines for ${name}.`;
    case 'Database':
      return `Persistence tier: manages memory buffers, data storage, and cache synchronization for ${name}.`;
    case 'Configuration':
      return `Environment configuration: orchestrates compile-time parameters and runtime options for ${name}.`;
    default:
      return `Shared utility: provides reusable helpers, data structures, and formats for ${name}.`;
  }
}

/**
 * Creates synthetic symbols for a file based on naming and language patterns
 */
export function generateSyntheticSymbols(filePath: string, name: string): CodeSymbol[] {
  const baseName = name.replace(/\.[^/.]+$/, '');
  const cleanPascal = baseName
    .split(/[-_.]/)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
  const cleanCamel = cleanPascal.charAt(0).toLowerCase() + cleanPascal.slice(1);

  const symbols: CodeSymbol[] = [];

  // Main primary class/interface
  symbols.push({
    id: `${filePath}#${cleanPascal}`,
    name: cleanPascal,
    kind: filePath.endsWith('.hpp') || filePath.endsWith('.h') ? 'interface' : 'class',
    lineStart: 1,
    lineEnd: 25,
    isExported: true,
    signature: `export class ${cleanPascal}`,
  });

  // Secondary execution function
  symbols.push({
    id: `${filePath}#${cleanCamel}Handler`,
    name: `${cleanCamel}Handler`,
    kind: 'function',
    lineStart: 28,
    lineEnd: 48,
    isExported: true,
    signature: `export function ${cleanCamel}Handler(): void`,
  });

  return symbols;
}

/**
 * Generates synthetic imports by inferring realistic dependencies in the repo
 */
export function generateSyntheticImports(
  filePath: string,
  allPaths: string[],
  cluster: ModuleCluster
): ImportRelation[] {
  const imports: ImportRelation[] = [];
  const currentDir = filePath.split('/').slice(0, -1).join('/');

  // 1. Link matching header (.cpp -> .hpp/.h)
  if (filePath.endsWith('.cpp') || filePath.endsWith('.cc')) {
    const base = filePath.replace(/\.[^/.]+$/, '');
    const header = allPaths.find(p => (p.endsWith('.hpp') || p.endsWith('.h')) && p.includes(base.split('/').pop() || ''));
    if (header && header !== filePath) {
      imports.push({
        sourcePath: filePath,
        targetRaw: header,
        resolvedTarget: header,
        importedItems: [header.split('/').pop() || ''],
        rawStatement: `#include "${header.split('/').pop()}"`,
        line: 1,
      });
    }
  }

  // 2. Link sibling file in the same directory
  const sibling = allPaths.find(p => p !== filePath && p.startsWith(currentDir + '/') && !imports.some(i => i.resolvedTarget === p));
  if (sibling) {
    imports.push({
      sourcePath: filePath,
      targetRaw: sibling,
      resolvedTarget: sibling,
      importedItems: [sibling.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Module'],
      rawStatement: `import { ${sibling.split('/').pop()?.replace(/\.[^/.]+$/, '')} } from './${sibling.split('/').pop()}';`,
      line: 3,
    });
  }

  // 3. Link common layer target based on cluster
  let targetCluster: ModuleCluster | null = null;
  if (cluster === 'Frontend' || cluster === 'API Layer') targetCluster = 'Services';
  else if (cluster === 'Services') targetCluster = 'Database';
  else if (cluster === 'Auth & Security') targetCluster = 'Services';

  if (targetCluster) {
    const layerTarget = allPaths.find(p => p !== filePath && inferModuleCluster(p) === targetCluster);
    if (layerTarget && !imports.some(i => i.resolvedTarget === layerTarget)) {
      imports.push({
        sourcePath: filePath,
        targetRaw: layerTarget,
        resolvedTarget: layerTarget,
        importedItems: [layerTarget.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'TargetService'],
        rawStatement: `// delegates to ${layerTarget.split('/').pop()}`,
        line: 5,
      });
    }
  }

  return imports;
}

/**
 * Synthesizes a complete architectural repository model from GitHub API data
 */
export function synthesizeCompleteRepository(
  repoMetadata: {
    name: string;
    fullName: string;
    description: string;
    defaultBranch: string;
    languages: Record<string, number>;
    frameworks?: string[];
    packageManagers?: string[];
    entryPoints?: string[];
    configFiles?: string[];
    maxFiles?: number;
  },
  fetchedFiles: Array<{ path: string; content: string; size: number }>,
  fullTree: Array<{ path: string; size: number }>,
  options?: { maxFiles?: number }
): { repository: RepositoryModel; report: SyntheticPipelineReport } {
  const fetchedPaths = new Set(fetchedFiles.map(f => f.path));
  const allTreePaths = fullTree.map(t => t.path);

  // 1. Identify Entry Points across full tree
  const detectedEntryPoints = identifyCoreEntryPoints(allTreePaths, Object.keys(repoMetadata.languages)[0]);

  // 2. Build final file roster: start with fetched files
  const rosterFiles: RepoFile[] = fetchedFiles.map(f => {
    const cluster = inferModuleCluster(f.path);
    const symbols = extractSymbolsFromContent(f.content, f.path);
    const imports = extractImportsFromContent(f.content, f.path, allTreePaths);
    const purpose = generateSyntheticPurpose(f.path, cluster);
    const isEP = detectedEntryPoints.some(ep => ep.path === f.path);

    return {
      path: f.path,
      name: f.path.split('/').pop() || f.path,
      extension: f.path.includes('.') ? `.${f.path.split('.').pop()}` : '',
      size: f.size,
      linesCount: f.content.split('\n').length,
      moduleCluster: cluster,
      content: f.content,
      symbols,
      imports,
      dependents: [],
      dependencies: [],
      isSynthetic: false,
      moduleSummary: purpose,
      isEntryPoint: isEP,
    };
  });

  // 3. For tree files whose full raw content was not downloaded, generate module metadata
  // Respect ATLAS_MAX_FILES (default 5000)
  const envMaxFiles = typeof process !== 'undefined' && process.env?.ATLAS_MAX_FILES
    ? parseInt(process.env.ATLAS_MAX_FILES, 10)
    : 0;
  const maxTotalFiles = options?.maxFiles || repoMetadata.maxFiles || envMaxFiles || 5000;

  const candidateTreeItems = fullTree.filter(t => !fetchedPaths.has(t.path));
  const syntheticFilesToAdd: RepoFile[] = [];

  for (const item of candidateTreeItems) {
    if (rosterFiles.length + syntheticFilesToAdd.length >= maxTotalFiles) break;

    const cluster = inferModuleCluster(item.path);
    const isEP = detectedEntryPoints.some(ep => ep.path === item.path);
    const name = item.path.split('/').pop() || item.path;
    const purpose = generateSyntheticPurpose(item.path, cluster);
    const symbols = generateSyntheticSymbols(item.path, name);
    const imports = generateSyntheticImports(item.path, allTreePaths, cluster);
    const estimatedLines = Math.max(25, Math.min(800, Math.round((item.size || 2000) / 42)));

    const syntheticContent = `/**
 * [SYNTHETIC ARCHITECTURAL MODULE]
 * Path: ${item.path}
 * Cluster: ${cluster}
 * Purpose: ${purpose}
 */
${imports.map(i => i.rawStatement).join('\n')}

${symbols.map(s => `${s.signature} { /* implementation */ }`).join('\n\n')}
`;

    syntheticFilesToAdd.push({
      path: item.path,
      name,
      extension: item.path.includes('.') ? `.${item.path.split('.').pop()}` : '',
      size: item.size || 2400,
      linesCount: estimatedLines,
      moduleCluster: cluster,
      content: syntheticContent,
      symbols,
      imports,
      dependents: [],
      dependencies: [],
      isSynthetic: true,
      moduleSummary: purpose,
      isEntryPoint: isEP,
    });
  }

  const allFiles = [...rosterFiles, ...syntheticFilesToAdd];

  // 4. Construct complete Knowledge Graph
  const graph = buildKnowledgeGraph(allFiles);

  // Link dependencies and dependents back to files
  const fileMap: Record<string, RepoFile> = {};
  allFiles.forEach(f => {
    f.dependencies = graph.adjacencyList[f.path] || [];
    f.dependents = graph.reverseAdjacencyList[f.path] || [];
    fileMap[f.path] = f;
  });

  // Calculate cluster breakdown
  const clusterBreakdown: Record<ModuleCluster, number> = {
    'Frontend': 0,
    'API Layer': 0,
    'Auth & Security': 0,
    'Services': 0,
    'Database': 0,
    'Configuration': 0,
    'Utilities': 0,
  };
  allFiles.forEach(f => {
    clusterBreakdown[f.moduleCluster] = (clusterBreakdown[f.moduleCluster] || 0) + 1;
  });

  // 5. Generate Key Subsystems Summary
  const keySubsystems = Object.entries(clusterBreakdown)
    .filter(([_, count]) => count > 0)
    .map(([cluster, count]) => {
      const topFile = allFiles.find(f => f.moduleCluster === cluster);
      return {
        name: `${cluster} Subsystem`,
        cluster: cluster as ModuleCluster,
        purpose: topFile?.moduleSummary || `${cluster} Tier`,
        fileCount: count,
      };
    });

  const report: SyntheticPipelineReport = {
    repositoryName: repoMetadata.name,
    totalTreeBlobs: fullTree.length,
    totalIndexedModules: allFiles.length,
    realFilesCount: rosterFiles.length,
    syntheticModulesCount: syntheticFilesToAdd.length,
    entryPoints: detectedEntryPoints,
    clusterBreakdown,
    keySubsystems,
  };

  const repository: RepositoryModel = {
    id: `github-${repoMetadata.name.toLowerCase()}`,
    name: repoMetadata.name,
    fullName: repoMetadata.fullName,
    description: repoMetadata.description,
    branch: repoMetadata.defaultBranch || 'main',
    availableBranches: [repoMetadata.defaultBranch || 'main'],
    languages: repoMetadata.languages,
    frameworks: repoMetadata.frameworks || ['Native Architecture'],
    packageManagers: repoMetadata.packageManagers || ['Standard Toolchain'],
    entryPoints: detectedEntryPoints.map(ep => ep.path),
    configFiles: repoMetadata.configFiles || ['CMakeLists.txt', 'package.json'],
    files: allFiles,
    fileMap,
    graph,
  };

  return { repository, report };
}
