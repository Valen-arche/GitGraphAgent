import { extname } from "node:path";
import { readFile, stat } from "node:fs/promises";
import { EXTENSION_TO_LANGUAGE } from "./extensionMap.js";
import { walkFiles } from "./walkFiles.js";
import type { LanguageStat } from "../types/index.js";

/** Files larger than this are counted toward fileCount but skipped for line counting. */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function countLines(content: string): number {
  if (content.length === 0) return 0;
  const newlineCount = (content.match(/\n/g) ?? []).length;
  return content.endsWith("\n") ? newlineCount : newlineCount + 1;
}

/**
 * Walks `rootDir` and returns per-language stats (file count, line count, % of total
 * lines). Only extensions in EXTENSION_TO_LANGUAGE are counted; everything else
 * (configs, markdown, binaries, lockfiles) is ignored on purpose.
 */
export async function detectLanguages(rootDir: string): Promise<LanguageStat[]> {
  const byLanguage = new Map<string, { fileCount: number; lineCount: number }>();

  for await (const file of walkFiles(rootDir)) {
    const language = EXTENSION_TO_LANGUAGE[extname(file.relPath)];
    if (!language) continue;

    const current = byLanguage.get(language) ?? { fileCount: 0, lineCount: 0 };
    current.fileCount += 1;

    const fileStat = await stat(file.absPath);
    if (fileStat.size <= MAX_FILE_SIZE_BYTES) {
      const content = await readFile(file.absPath, "utf8");
      current.lineCount += countLines(content);
    }

    byLanguage.set(language, current);
  }

  const totalLines = [...byLanguage.values()].reduce((sum, v) => sum + v.lineCount, 0);

  return [...byLanguage.entries()]
    .map(([language, { fileCount, lineCount }]) => ({
      language,
      fileCount,
      lineCount,
      percentage: totalLines === 0 ? 0 : Math.round((lineCount / totalLines) * 1000) / 10,
    }))
    .sort((a, b) => b.lineCount - a.lineCount);
}
