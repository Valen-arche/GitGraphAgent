import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import simpleGit from "simple-git";
import type { IngestedRepository } from "../types/index.js";

export interface CloneOptions {
  /** Abort the clone if it takes longer than this. Defaults to 30s. */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Shallow-clones `cloneUrl` into a fresh temp directory and reports the checked-out
 * commit SHA. Not GitHub-specific and performs no URL validation — callers that accept
 * untrusted input must validate the URL first (see parseGithubRepoUrl).
 */
export async function cloneRepository(
  cloneUrl: string,
  options: CloneOptions = {},
): Promise<IngestedRepository> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const workDir = await mkdtemp(join(tmpdir(), "git-graph-agent-"));

  let cleanedUp = false;
  const cleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    await rm(workDir, { recursive: true, force: true });
  };

  try {
    const git = simpleGit({ timeout: { block: timeoutMs } });
    await git.clone(cloneUrl, workDir, ["--depth", "1", "--single-branch"]);
    const commitSha = (await simpleGit(workDir).revparse(["HEAD"])).trim();
    return { localPath: workDir, commitSha, cleanup };
  } catch (err) {
    await cleanup();
    throw err;
  }
}
