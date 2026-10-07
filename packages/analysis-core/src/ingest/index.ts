import { parseGithubRepoUrl } from "./parseRepoUrl.js";
import { fetchRepoMetadata } from "./githubApi.js";
import { cloneRepository } from "./clone.js";
import { GithubAccessError, GithubNetworkError, RepoTooLargeError } from "./errors.js";
import type { IngestedRepository } from "../types/index.js";

export { parseGithubRepoUrl } from "./parseRepoUrl.js";
export { cloneRepository } from "./clone.js";
export { fetchRepoMetadata } from "./githubApi.js";
export {
  InvalidRepoUrlError,
  GithubAccessError,
  GithubRateLimitError,
  GithubNetworkError,
  RepoTooLargeError,
} from "./errors.js";
export type { GithubAccessErrorCode } from "./errors.js";

export const MAX_REPO_SIZE_KB = 300_000; // 300 MB, matches the MVP limit in the design doc

export interface IngestRepositoryOptions {
  maxSizeKb?: number;
  timeoutMs?: number;
}

/**
 * End-to-end, safe entry point for turning a user-supplied GitHub URL into a local
 * shallow clone: validates the URL, rejects private or oversized repos up front via the
 * GitHub API, then clones. This is what the API layer should call — never cloneRepository
 * directly with unvalidated input.
 */
export async function ingestRepository(
  repoUrl: string,
  options: IngestRepositoryOptions = {},
): Promise<IngestedRepository> {
  const maxSizeKb = options.maxSizeKb ?? MAX_REPO_SIZE_KB;
  const ref = parseGithubRepoUrl(repoUrl);
  const metadata = await fetchRepoMetadata(ref);

  if (metadata.private) {
    // Only reachable when GITHUB_TOKEN is set and has access — otherwise fetchRepoMetadata
    // already threw repo_not_found_or_private above, since GitHub hides private repos
    // behind a 404 for callers without access.
    throw new GithubAccessError(
      "repo_private",
      `${ref.owner}/${ref.repo} is a private repository; only public repos are supported`,
    );
  }
  if (metadata.sizeKb > maxSizeKb) {
    throw new RepoTooLargeError(
      `${ref.owner}/${ref.repo} is ${metadata.sizeKb}KB, which exceeds the ${maxSizeKb}KB limit`,
    );
  }

  try {
    return await cloneRepository(ref.cloneUrl, { timeoutMs: options.timeoutMs });
  } catch (cause) {
    throw new GithubNetworkError(
      `Failed to clone ${ref.owner}/${ref.repo}: ${(cause as Error).message}`,
      { cause },
    );
  }
}
