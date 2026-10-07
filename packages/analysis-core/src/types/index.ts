export interface GithubRepoRef {
  owner: string;
  repo: string;
  /** HTTPS clone URL, normalized (no .git suffix duplication, no trailing slash). */
  cloneUrl: string;
}

export interface IngestedRepository {
  /** Absolute path to the shallow clone on local disk. */
  localPath: string;
  /** Commit SHA checked out (HEAD of the default branch at clone time). */
  commitSha: string;
  /** Must be called when done to remove the local clone. Safe to call more than once. */
  cleanup: () => Promise<void>;
}

export interface LanguageStat {
  language: string;
  fileCount: number;
  lineCount: number;
  /** 0-100, share of lineCount across all detected languages. */
  percentage: number;
}

export interface ModuleNode {
  /** Folder path relative to repo root ("" for the repo root itself). */
  id: string;
  fileCount: number;
}

export interface ModuleEdge {
  from: string;
  to: string;
  /** Number of individual file-to-file imports folded into this module-level edge. */
  weight: number;
}

export interface ModuleGraph {
  nodes: ModuleNode[];
  edges: ModuleEdge[];
  /** Import specifiers found but not resolved to a file on disk (e.g. npm packages, aliases). */
  unresolvedImportCount: number;
}
