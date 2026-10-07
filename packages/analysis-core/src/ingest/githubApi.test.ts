import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchRepoMetadata } from "./githubApi.js";
import { GithubAccessError, GithubNetworkError, GithubRateLimitError } from "./errors.js";

const ref = { owner: "octocat", repo: "Hello-World", cloneUrl: "https://github.com/octocat/Hello-World.git" };

describe("fetchRepoMetadata", () => {
  const originalFetch = global.fetch;
  const originalToken = process.env.GITHUB_TOKEN;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.GITHUB_TOKEN = originalToken;
  });

  it("returns metadata on a successful response", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ size: 42, default_branch: "main", private: false }), { status: 200 }),
    ) as typeof fetch;

    const result = await fetchRepoMetadata(ref);
    expect(result).toEqual({ sizeKb: 42, defaultBranch: "main", private: false });
  });

  it("throws GithubAccessError('repo_not_found_or_private') on 404, without leaking that as a network failure", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("", { status: 404 })) as typeof fetch;
    await expect(fetchRepoMetadata(ref)).rejects.toBeInstanceOf(GithubAccessError);
    await expect(fetchRepoMetadata(ref)).rejects.toMatchObject({ code: "repo_not_found_or_private" });
  });

  it("throws GithubRateLimitError on 403 with X-RateLimit-Remaining: 0", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response("", { status: 403, headers: { "x-ratelimit-remaining": "0" } }),
    ) as typeof fetch;
    await expect(fetchRepoMetadata(ref)).rejects.toBeInstanceOf(GithubRateLimitError);
  });

  it("throws GithubNetworkError (not GithubAccessError) when fetch itself rejects", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("fetch failed")) as typeof fetch;
    await expect(fetchRepoMetadata(ref)).rejects.toBeInstanceOf(GithubNetworkError);
  });

  it("throws GithubNetworkError on an unexpected 5xx", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("", { status: 500 })) as typeof fetch;
    await expect(fetchRepoMetadata(ref)).rejects.toBeInstanceOf(GithubNetworkError);
  });

  it("sends an Authorization header when GITHUB_TOKEN is set, and never otherwise", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(
        async () =>
          new Response(JSON.stringify({ size: 1, default_branch: "main", private: false }), { status: 200 }),
      );
    global.fetch = fetchMock as typeof fetch;

    process.env.GITHUB_TOKEN = "test-token";
    await fetchRepoMetadata(ref);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer test-token");

    delete process.env.GITHUB_TOKEN;
    await fetchRepoMetadata(ref);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBeUndefined();
  });
});
