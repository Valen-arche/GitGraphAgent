import { mkdtemp, rm, writeFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import simpleGit from "simple-git";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cloneRepository } from "./clone.js";

describe("cloneRepository", () => {
  let sourceRepoDir: string;
  let expectedSha: string;

  beforeEach(async () => {
    sourceRepoDir = await mkdtemp(join(tmpdir(), "clone-test-source-"));
    const git = simpleGit(sourceRepoDir);
    await git.init(["--initial-branch=main"]);
    await git.addConfig("user.email", "test@example.com");
    await git.addConfig("user.name", "Test");
    await writeFile(join(sourceRepoDir, "hello.txt"), "hi\n");
    await git.add(".");
    await git.commit("initial commit");
    expectedSha = (await git.revparse(["HEAD"])).trim();
  });

  afterEach(async () => {
    await rm(sourceRepoDir, { recursive: true, force: true });
  });

  it("clones into a fresh temp dir and reports the checked-out commit", async () => {
    const result = await cloneRepository(sourceRepoDir);
    try {
      expect(result.commitSha).toBe(expectedSha);
      const fileStat = await stat(join(result.localPath, "hello.txt"));
      expect(fileStat.isFile()).toBe(true);
    } finally {
      await result.cleanup();
    }
  });

  it("removes the local directory on cleanup", async () => {
    const result = await cloneRepository(sourceRepoDir);
    await result.cleanup();
    await expect(stat(result.localPath)).rejects.toThrow();
  });

  it("cleans up after itself even when the clone fails", async () => {
    await expect(cloneRepository("/nonexistent/path/to/repo")).rejects.toThrow();
  });
});
