import type { GithubRepoRef } from "../types/index.js";

export interface RepoMetadata {
  /** Reported by GitHub in KiB. */
  sizeKb: number;
  defaultBranch: string;
  private: boolean;
}

/**
 * Looks up repo metadata via the public GitHub REST API before cloning, so an oversized
 * or private repo can be rejected without ever running `git clone`.
 */
export async function fetchRepoMetadata(ref: GithubRepoRef): Promise<RepoMetadata> {
  const res = await fetch(`https://api.github.com/repos/${ref.owner}/${ref.repo}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "git-graph-agent" },
  });
  if (res.status === 404) {
    throw new Error(`Repository ${ref.owner}/${ref.repo} not found`);
  }
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status} looking up ${ref.owner}/${ref.repo}`);
  }
  const data = (await res.json()) as { size: number; default_branch: string; private: boolean };
  return { sizeKb: data.size, defaultBranch: data.default_branch, private: data.private };
}
