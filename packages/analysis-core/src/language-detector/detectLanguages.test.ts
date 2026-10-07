import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectLanguages } from "./detectLanguages.js";

describe("detectLanguages", () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), "lang-detector-test-"));
  });

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  it("counts files and lines per language, ignoring unknown extensions and vendor dirs", async () => {
    await writeFile(join(rootDir, "index.ts"), "a\nb\nc\n"); // 3 lines
    await writeFile(join(rootDir, "README.md"), "not counted\n");

    await mkdir(join(rootDir, "src"));
    await writeFile(join(rootDir, "src", "app.py"), "x\ny\n"); // 2 lines

    await mkdir(join(rootDir, "node_modules", "pkg"), { recursive: true });
    await writeFile(join(rootDir, "node_modules", "pkg", "index.js"), "should\nbe\nignored\n");

    const stats = await detectLanguages(rootDir);
    const byLanguage = Object.fromEntries(stats.map((s) => [s.language, s]));

    expect(byLanguage.TypeScript).toEqual({
      language: "TypeScript",
      fileCount: 1,
      lineCount: 3,
      percentage: 60,
    });
    expect(byLanguage.Python).toEqual({
      language: "Python",
      fileCount: 1,
      lineCount: 2,
      percentage: 40,
    });
    expect(byLanguage.JavaScript).toBeUndefined();
    expect(Object.keys(byLanguage)).toHaveLength(2);
  });

  it("returns an empty array for a repo with no recognized source files", async () => {
    await writeFile(join(rootDir, "README.md"), "hello\n");
    expect(await detectLanguages(rootDir)).toEqual([]);
  });
});
