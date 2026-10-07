import type { GithubRepoRef } from "../types/index.js";
import { InvalidRepoUrlError } from "./errors.js";

const GITHUB_URL_PATTERN =
  /^https:\/\/github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)\/([a-zA-Z0-9._-]+?)(?:\.git)?\/?$/;

/**
 * Validates that a user-supplied string is a GitHub repository URL and nothing else.
 * This is the SSRF/abuse guard: only https://github.com/{owner}/{repo} is accepted,
 * so a malicious input can never make the ingest layer reach an arbitrary host.
 */
export function parseGithubRepoUrl(input: string): GithubRepoRef {
  const trimmed = input.trim();
  const match = GITHUB_URL_PATTERN.exec(trimmed);
  if (!match) {
    throw new InvalidRepoUrlError(
      `"${input}" is not a valid GitHub repository URL (expected https://github.com/{owner}/{repo})`,
    );
  }
  const [, owner, repo] = match;
  return {
    owner,
    repo,
    cloneUrl: `https://github.com/${owner}/${repo}.git`,
  };
}
