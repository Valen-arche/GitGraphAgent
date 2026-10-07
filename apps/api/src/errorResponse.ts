import {
  GithubAccessError,
  GithubNetworkError,
  GithubRateLimitError,
  InvalidRepoUrlError,
  RepoTooLargeError,
} from "@git-graph-agent/analysis-core";

export interface ErrorResponse {
  status: number;
  body: { error: string; code: string };
}

/**
 * Maps a typed ingest error to an HTTP status and a stable machine-readable `code`.
 * The frontend branches on `code`, not on the message text — the message is for
 * humans, the code is the contract.
 */
export function toErrorResponse(err: unknown, log: { error: (err: unknown) => void }): ErrorResponse {
  if (err instanceof InvalidRepoUrlError) {
    return { status: 400, body: { error: err.message, code: err.code } };
  }
  if (err instanceof GithubAccessError) {
    // repo_not_found_or_private -> 404 (we genuinely don't know which); repo_private -> 403
    // (a token confirmed it exists and is private, so "forbidden" is the accurate status).
    const status = err.code === "repo_private" ? 403 : 404;
    return { status, body: { error: err.message, code: err.code } };
  }
  if (err instanceof GithubRateLimitError) {
    return { status: 429, body: { error: err.message, code: err.code } };
  }
  if (err instanceof RepoTooLargeError) {
    return { status: 413, body: { error: err.message, code: err.code } };
  }
  if (err instanceof GithubNetworkError) {
    return { status: 502, body: { error: err.message, code: err.code } };
  }

  // Unexpected: log the real error server-side, never leak internals to the client.
  log.error(err);
  return { status: 500, body: { error: "Unexpected server error", code: "internal_error" } };
}
