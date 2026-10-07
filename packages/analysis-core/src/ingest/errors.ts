/**
 * Typed errors for the ingest pipeline, so callers (the API layer) can map each
 * failure to the right HTTP status and the frontend can show the right message
 * instead of a generic "failed to fetch" for everything.
 */

export class InvalidRepoUrlError extends Error {
  readonly code = "invalid_url";
  constructor(message: string) {
    super(message);
    this.name = "InvalidRepoUrlError";
  }
}

export type GithubAccessErrorCode = "repo_not_found_or_private" | "repo_private";

/**
 * GitHub returns 404 (not 403) for a private repo when the caller has no access,
 * specifically so an unauthenticated client can't tell "doesn't exist" apart from
 * "exists but you can't see it". So without a token we can only report
 * "repo_not_found_or_private". With a token that *can* see the repo but it's
 * private, ingestRepository reports "repo_private" instead — a real distinction.
 */
export class GithubAccessError extends Error {
  readonly code: GithubAccessErrorCode;
  constructor(code: GithubAccessErrorCode, message: string) {
    super(message);
    this.name = "GithubAccessError";
    this.code = code;
  }
}

export class GithubRateLimitError extends Error {
  readonly code = "rate_limited";
  constructor(message = "GitHub API rate limit exceeded; try again later") {
    super(message);
    this.name = "GithubRateLimitError";
  }
}

export class RepoTooLargeError extends Error {
  readonly code = "repo_too_large";
  constructor(message: string) {
    super(message);
    this.name = "RepoTooLargeError";
  }
}

/** Connectivity problem talking to GitHub (DNS, TLS, timeout, 5xx) — not a permissions issue. */
export class GithubNetworkError extends Error {
  readonly code = "network_error";
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "GithubNetworkError";
  }
}
