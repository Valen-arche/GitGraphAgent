import { dirname, extname } from "node:path";
import { readFile } from "node:fs/promises";
import { walkFiles } from "../language-detector/walkFiles.js";
import { extractImportSpecifiers } from "./extractImports.js";
import { resolveImport } from "./resolveImport.js";
import type { ModuleGraph } from "../types/index.js";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

/** "" represents the repo root itself, so a file directly under root is its own module. */
function moduleOf(relPath: string): string {
  const dir = dirname(relPath);
  return dir === "." ? "" : dir;
}

/**
 * Builds a folder-level dependency graph from static imports in TS/JS source files.
 * Only relative imports that resolve to a real file are turned into edges; bare
 * specifiers (npm packages) and anything dynamic/unresolvable are counted but
 * dropped from the graph rather than guessed at — see resolveImport.
 */
export async function buildModuleGraph(rootDir: string): Promise<ModuleGraph> {
  const fileCountByModule = new Map<string, number>();
  const edgeWeights = new Map<string, number>(); // key: "from=>to"
  let unresolvedImportCount = 0;

  for await (const file of walkFiles(rootDir)) {
    if (!SOURCE_EXTENSIONS.has(extname(file.relPath))) continue;

    const moduleId = moduleOf(file.relPath);
    fileCountByModule.set(moduleId, (fileCountByModule.get(moduleId) ?? 0) + 1);

    const content = await readFile(file.absPath, "utf8");
    let specifiers: string[];
    try {
      specifiers = extractImportSpecifiers(file.absPath, content);
    } catch {
      continue; // unparsable file (e.g. syntax error in the analyzed repo) — skip, don't fail the whole analysis
    }

    for (const specifier of specifiers) {
      if (!specifier.startsWith(".")) continue; // bare package specifier, not a module-graph edge
      const resolved = resolveImport(rootDir, file.relPath, specifier);
      if (!resolved) {
        unresolvedImportCount += 1;
        continue;
      }
      const targetModule = moduleOf(resolved);
      if (targetModule === moduleId) continue; // intra-module import, not interesting at folder granularity
      const key = `${moduleId}=>${targetModule}`;
      edgeWeights.set(key, (edgeWeights.get(key) ?? 0) + 1);
    }
  }

  return {
    nodes: [...fileCountByModule.entries()].map(([id, fileCount]) => ({ id, fileCount })),
    edges: [...edgeWeights.entries()].map(([key, weight]) => {
      const [from, to] = key.split("=>");
      return { from, to, weight };
    }),
    unresolvedImportCount,
  };
}
