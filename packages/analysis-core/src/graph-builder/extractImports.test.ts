import { describe, expect, it } from "vitest";
import { extractImportSpecifiers } from "./extractImports.js";

describe("extractImportSpecifiers", () => {
  it("extracts import, re-export, dynamic import and require specifiers", () => {
    const source = `
      import a from "./a";
      import { b } from "../b";
      export { c } from "./c";
      export * from "./d";
      const e = await import("./e");
      const f = require("./f");
      import pkg from "some-npm-package";
    `;
    const result = extractImportSpecifiers("file.ts", source);
    expect(result.sort()).toEqual(
      ["../b", "./a", "./c", "./d", "./e", "./f", "some-npm-package"].sort(),
    );
  });

  it("returns an empty list for a file with no imports", () => {
    expect(extractImportSpecifiers("file.ts", "export const x = 1;\n")).toEqual([]);
  });
});
