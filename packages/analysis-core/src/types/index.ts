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
