import type { GithubRepoRef } from "../types/index.js";
import { GithubAccessError, GithubNetworkError, GithubRateLimitError } from "./errors.js";

export interface RepoMetadata {
  /** Reported by GitHub in KiB. */
  sizeKb: number;
  defaultBranch: string;
  private: boolean;
}

/**
 * Looks up repo metadata via the GitHub REST API before cloning, so an oversized,
 * private, or nonexistent repo can be rejected without ever running `git clone`.
 *
 * If GITHUB_TOKEN is set in the server environment it's sent as a bearer token to
 * raise the rate limit and allow resolving private repos the token has access to.
 * This function runs server-side only (analysis-core has no HTTP/browser surface) —
 * the token is never read by, or exposed to, the frontend.
 */
export async function fetchRepoMetadata(ref: GithubRepoRef): Promise<RepoMetadata> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "git-graph-agent",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`https://api.github.com/repos/${ref.owner}/${ref.repo}`, { headers });
  } catch (cause) {
    throw new GithubNetworkError(
      `Could not reach the GitHub API: ${(cause as Error).message}`,
      { cause },
    );
  }

  if (res.status === 404) {
    // Deliberately ambiguous on GitHub's side: an unauthenticated (or unauthorized)
    // caller gets 404 for both "doesn't exist" and "exists but is private". We can't
    // tell them apart without a token that has access, so the message says so.
    throw new GithubAccessError(
      "repo_not_found_or_private",
      `${ref.owner}/${ref.repo} was not found. It may not exist, or it may be a private repository this server has no access to.`,
    );
  }
  if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0") {
    throw new GithubRateLimitError();
  }
  if (!res.ok) {
    throw new GithubNetworkError(`GitHub API returned ${res.status} looking up ${ref.owner}/${ref.repo}`);
  }

  const data = (await res.json()) as { size: number; default_branch: string; private: boolean };
  return { sizeKb: data.size, defaultBranch: data.default_branch, private: data.private };
}
