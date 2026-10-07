"use client";

import { useState } from "react";
import { ModuleGraphView } from "./ModuleGraphView";
import { AnalyzingStatus } from "./AnalyzingStatus";
import { describeError } from "./errorMessages";
import type { AnalyzeResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("https://github.com/Valen-arche/GitGraphAgent");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    setError(null);
    setResult(null); // nothing renders below until a full, successful response lands

    let res: Response;
    try {
      res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
    } catch {
      // fetch() itself threw: our API is unreachable (down, wrong URL, CORS, DNS).
      // This is NOT a GitHub permissions problem, so it gets its own message instead
      // of surfacing the browser's raw "Failed to fetch".
      setError(describeError("api_unreachable", ""));
      setLoading(false);
      return;
    }

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(describeError(data?.code ?? "unknown", data?.error ?? `Error ${res.status}`));
      setLoading(false);
      return;
    }

    setResult(data as AnalyzeResponse);
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Git Graph Agent</h1>
      <p style={{ opacity: 0.7, marginTop: 0 }}>Pegá una URL de GitHub pública para ver su radiografía.</p>

      <div style={{ display: "flex", gap: 8, margin: "20px 0" }}>
        <input
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #2a2f3d",
            background: "#171a23",
            color: "#e6e8ee",
          }}
        />
        <button
          onClick={analyze}
          disabled={loading}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            background: "#5b6ee8",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Analizando…" : "Analizar"}
        </button>
      </div>

      {loading && <AnalyzingStatus />}

      {!loading && error && (
        <p
          role="alert"
          style={{
            color: "#f28b82",
            background: "#2a1416",
            border: "1px solid #5a2328",
            borderRadius: 8,
            padding: "12px 16px",
          }}
        >
          {error}
        </p>
      )}

      {!loading && result && (
        <>
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, opacity: 0.8 }}>
              Overview — commit <code>{result.commitSha.slice(0, 7)}</code>
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {result.languages.map((lang) => (
                <div
                  key={lang.language}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#171a23",
                    border: "1px solid #2a2f3d",
                  }}
                >
                  <strong>{lang.language}</strong> — {lang.percentage}% ({lang.fileCount} archivos)
                </div>
              ))}
              {result.languages.length === 0 && (
                <p style={{ opacity: 0.7 }}>No se detectaron lenguajes reconocidos.</p>
              )}
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 16, opacity: 0.8 }}>
              Architecture Map
              {result.graph.unresolvedImportCount > 0 && (
                <span style={{ opacity: 0.6, fontWeight: 400 }}>
                  {" "}
                  ({result.graph.unresolvedImportCount} imports no resueltos a un archivo del repo)
                </span>
              )}
            </h2>
            <ModuleGraphView graph={result.graph} />
          </section>
        </>
      )}
    </main>
  );
}
