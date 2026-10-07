import { dirname, join, relative } from "node:path";
import { existsSync } from "node:fs";

const CANDIDATE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const JS_FAMILY_EXTENSION = /\.(js|jsx|mjs|cjs)$/;

/**
 * Resolves a relative import specifier (e.g. "./foo") to a file inside the repo,
 * relative to repo root. Returns null for bare specifiers (npm packages, path
 * aliases) and for relative specifiers that don't resolve to a file on disk —
 * both cases are expected and counted as "unresolved", not errors.
 */
export function resolveImport(
  rootDir: string,
  importerRelPath: string,
  specifier: string,
): string | null {
  if (!specifier.startsWith(".")) return null;

  const importerAbsDir = join(rootDir, dirname(importerRelPath));
  const targetAbsPath = join(importerAbsDir, specifier);

  const candidates = [
    targetAbsPath,
    ...CANDIDATE_EXTENSIONS.map((ext) => targetAbsPath + ext),
    ...CANDIDATE_EXTENSIONS.map((ext) => join(targetAbsPath, "index" + ext)),
  ];

  // TS/ESM convention: source imports "./engine.js" but the file on disk is engine.ts.
  if (JS_FAMILY_EXTENSION.test(targetAbsPath)) {
    const withoutExtension = targetAbsPath.replace(JS_FAMILY_EXTENSION, "");
    candidates.push(...CANDIDATE_EXTENSIONS.map((ext) => withoutExtension + ext));
  }

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return relative(rootDir, candidate);
    }
  }
  return null;
}
