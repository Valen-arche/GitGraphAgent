import { parseGithubRepoUrl } from "./parseRepoUrl.js";
import { fetchRepoMetadata } from "./githubApi.js";
import { cloneRepository } from "./clone.js";
import type { IngestedRepository } from "../types/index.js";

export { parseGithubRepoUrl } from "./parseRepoUrl.js";
export { cloneRepository } from "./clone.js";
export { fetchRepoMetadata } from "./githubApi.js";

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
    throw new Error(`Repository ${ref.owner}/${ref.repo} is private; only public repos are supported`);
  }
  if (metadata.sizeKb > maxSizeKb) {
    throw new Error(
      `Repository ${ref.owner}/${ref.repo} is ${metadata.sizeKb}KB, which exceeds the ${maxSizeKb}KB limit`,
    );
  }

  return cloneRepository(ref.cloneUrl, { timeoutMs: options.timeoutMs });
}
