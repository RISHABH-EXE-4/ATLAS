export type SymbolKind = 'function' | 'class' | 'interface' | 'component' | 'method' | 'variable' | 'type';

export interface CodeSymbol {
  id: string;
  name: string;
  kind: SymbolKind;
  lineStart: number;
  lineEnd: number;
  isExported: boolean;
  signature?: string;
  docstring?: string;
}

export interface ImportRelation {
  sourcePath: string; // file that has the import
  targetRaw: string;  // e.g. './AuthService' or '@/auth/AuthService'
  resolvedTarget: string; // resolved file path e.g. 'src/auth/AuthService.ts'
  importedItems: string[];
  rawStatement: string;
  line: number;
}

export type ModuleCluster = 
  | 'Frontend' 
  | 'API Layer' 
  | 'Services' 
  | 'Auth & Security' 
  | 'Database' 
  | 'Configuration' 
  | 'Utilities';

export interface RepoFile {
  path: string;
  name: string;
  extension: string;
  size: number;
  linesCount: number;
  moduleCluster: ModuleCluster;
  content: string;
  symbols: CodeSymbol[];
  imports: ImportRelation[];
  dependents: string[];   // Upstream: files that import this file
  dependencies: string[]; // Downstream: files this file imports
  isSynthetic?: boolean;
  moduleSummary?: string;
  isEntryPoint?: boolean;
}

export type RelationshipType = 'imports' | 'calls' | 'extends' | 'implements' | 'uses' | 'modifies';

export interface GraphNode {
  id: string;
  label: string;
  type: 'file' | 'symbol' | 'module';
  cluster: ModuleCluster;
  filePath: string;
  metrics: {
    inDegree: number;  // Afferent coupling
    outDegree: number; // Efferent coupling
    instability: number;
    lines: number;
  };
  symbolsCount: number;
  isSynthetic?: boolean;
  moduleSummary?: string;
  isEntryPoint?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  label?: string;
  evidence?: {
    line: number;
    statement: string;
  };
}

export interface CircularDependency {
  cycle: string[];
}

export interface CouplingHotspot {
  filePath: string;
  afferentCoupling: number; // dependents (who relies on this)
  efferentCoupling: number; // dependencies (who this relies on)
  instability: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  nodeMap: Record<string, GraphNode>;
  adjacencyList: Record<string, string[]>;
  reverseAdjacencyList: Record<string, string[]>;
  circularDependencies: CircularDependency[];
  couplingHotspots: CouplingHotspot[];
  clusters: Record<ModuleCluster, string[]>;
  metrics: {
    totalFiles: number;
    totalSymbols: number;
    totalEdges: number;
    healthScore: number;
  };
}

export interface RepositoryModel {
  id: string;
  name: string;
  fullName: string;
  description: string;
  branch: string;
  availableBranches: string[];
  languages: Record<string, number>; // e.g. { TypeScript: 72, Python: 18, CSS: 7, Other: 3 }
  frameworks: string[];
  packageManagers: string[];
  entryPoints: string[];
  configFiles: string[];
  files: RepoFile[];
  fileMap: Record<string, RepoFile>;
  graph: KnowledgeGraph;
}

export interface ImpactDependency {
  filePath: string;
  name: string;
  cluster: ModuleCluster;
  reason: string;
  evidenceSnippet?: string;
  line?: number;
  depth?: number;
  pathTraversed?: string[];
}

export interface SubsystemImpact {
  name: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number; // 0 to 100
  reason: string;
  affectedFilesCount: number;
}

export interface ImpactEvidence {
  file: string;
  line: number;
  statement: string;
  description: string;
}

export interface DependencyImpactResult {
  targetFile: string;
  targetFileName: string;
  cluster: ModuleCluster;
  directDependencies: ImpactDependency[]; // Downstream files imported by target
  directDependents: ImpactDependency[];   // Upstream files that rely on target
  indirectDependents: ImpactDependency[]; // Cascading blast radius
  subsystemImpacts: SubsystemImpact[];
  evidence: ImpactEvidence[];
  totalBlastRadius: number;
}

export interface FeatureImpactItem {
  filePath: string;
  type: 'OBSERVED' | 'AI_INFERENCE';
  action: 'MODIFY' | 'CREATE' | 'REVIEW';
  reason: string;
}

export interface FeatureImpactAnalysis {
  featurePrompt: string;
  summary: string;
  affectedSubsystems: Array<{
    name: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
  }>;
  filesToInvestigate: FeatureImpactItem[];
  potentialBreakages: string[];
  suggestedTests: string[];
  source?: string;
}

export interface SearchResult {
  filePath: string;
  fileName: string;
  cluster: ModuleCluster;
  matchingSnippet: string;
  line: number;
  reason: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  symbols: string[];
}

export interface PRReviewGuidance {
  filePath: string;
  priority: 'MUST_REVIEW' | 'IMPORTANT' | 'TRIVIAL';
  notes: string;
}

export interface PRAnalysisResult {
  prNumber: number;
  title: string;
  author: string;
  changedFiles: string[];
  summary: string;
  architectureImpact: Array<{
    subsystem: string;
    level: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
  }>;
  riskAnalysis: string[];
  dependencyChanges: string[];
  reviewerGuidance: PRReviewGuidance[];
}

export interface OnboardingSection {
  step: number;
  title: string;
  content: string;
  relevantFiles: string[];
}

export interface OnboardingGuide {
  title: string;
  sections: OnboardingSection[];
}

export type PersonaMode = 'beginner' | 'developer' | 'architect';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  initials: string;
  avatarColor?: string;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Default User',
  email: 'default.architect@atlas.dev',
  role: 'System Architect',
  initials: 'DU',
  avatarColor: 'from-purple-600 to-indigo-500',
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  persona?: PersonaMode;
  timestamp: string;
  source?: string;
  citations?: Array<{ file: string; line?: number }>;
  executionFlow?: string[];
}
