import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildModuleGraph } from "./buildModuleGraph.js";

describe("buildModuleGraph", () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), "graph-builder-test-"));
  });

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  it("builds folder-level edges from resolved relative imports and counts the rest", async () => {
    await mkdir(join(rootDir, "api"), { recursive: true });
    await mkdir(join(rootDir, "core"), { recursive: true });

    // api/server.ts imports from core/engine.ts (cross-module, relative, resolves)
    await writeFile(
      join(rootDir, "api", "server.ts"),
      `import { run } from "../core/engine.js";\nimport fastify from "fastify";\nconsole.log(run, fastify);\n`,
    );
    // core/engine.ts imports core/helper.ts (same module -> not an edge) and a missing file
    await writeFile(
      join(rootDir, "core", "engine.ts"),
      `import { helper } from "./helper.js";\nimport { missing } from "./does-not-exist.js";\nexport function run() { return helper() + missing; }\n`,
    );
    await writeFile(join(rootDir, "core", "helper.ts"), `export function helper() { return 1; }\n`);

    const graph = await buildModuleGraph(rootDir);

    const nodeIds = graph.nodes.map((n) => n.id).sort();
    expect(nodeIds).toEqual(["api", "core"]);

    expect(graph.edges).toEqual([{ from: "api", to: "core", weight: 1 }]);
    // "fastify" (bare specifier) is not counted as unresolved - it's simply not a relative import.
    // "./does-not-exist.js" is relative but doesn't resolve to a real file -> unresolved.
    expect(graph.unresolvedImportCount).toBe(1);
  });

  it("returns an empty graph for a repo with no JS/TS files", async () => {
    await writeFile(join(rootDir, "README.md"), "hello\n");
    const graph = await buildModuleGraph(rootDir);
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
    expect(graph.unresolvedImportCount).toBe(0);
  });
});
