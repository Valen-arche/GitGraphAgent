export interface LanguageStat {
  language: string;
  fileCount: number;
  lineCount: number;
  percentage: number;
}

export interface ModuleNode {
  id: string;
  fileCount: number;
}

export interface ModuleEdge {
  from: string;
  to: string;
  weight: number;
}

export interface ModuleGraph {
  nodes: ModuleNode[];
  edges: ModuleEdge[];
  unresolvedImportCount: number;
}

export interface AnalyzeResponse {
  repoUrl: string;
  commitSha: string;
  languages: LanguageStat[];
  graph: ModuleGraph;
}
