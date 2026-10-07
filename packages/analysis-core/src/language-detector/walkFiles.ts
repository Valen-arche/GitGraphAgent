import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { IGNORED_DIR_NAMES } from "./extensionMap.js";

export interface WalkedFile {
  absPath: string;
  relPath: string;
}

/** Recursively lists files under `rootDir`, skipping vendor/build directories. */
export async function* walkFiles(rootDir: string, relPath = ""): AsyncGenerator<WalkedFile> {
  const dirAbsPath = join(rootDir, relPath);
  const entries = await readdir(dirAbsPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIR_NAMES.has(entry.name)) continue;
      yield* walkFiles(rootDir, join(relPath, entry.name));
    } else if (entry.isFile()) {
      yield { absPath: join(dirAbsPath, entry.name), relPath: join(relPath, entry.name) };
    }
  }
}
