import { describe, expect, it } from "vitest";
import { parseGithubRepoUrl } from "./parseRepoUrl.js";

describe("parseGithubRepoUrl", () => {
  it("accepts a plain github.com URL", () => {
    expect(parseGithubRepoUrl("https://github.com/facebook/react")).toEqual({
      owner: "facebook",
      repo: "react",
      cloneUrl: "https://github.com/facebook/react.git",
    });
  });

  it("accepts a URL with a trailing .git and slash", () => {
    expect(parseGithubRepoUrl("https://github.com/facebook/react.git/")).toEqual({
      owner: "facebook",
      repo: "react",
      cloneUrl: "https://github.com/facebook/react.git",
    });
  });

  it.each([
    "http://github.com/facebook/react", // not https
    "https://evil.com/facebook/react", // wrong host
    "https://github.com/facebook", // missing repo
    "https://github.com/facebook/react/extra", // extra path segment
    "not a url at all",
    "https://github.com@evil.com/facebook/react", // userinfo trick
    "ftp://github.com/facebook/react",
  ])("rejects %s", (input) => {
    expect(() => parseGithubRepoUrl(input)).toThrow();
  });
});
