/**
 * Visible for the whole duration of fetch + analysis (clone, language detection,
 * graph build) — the caller must not render Overview/Architecture Map until the
 * response is fully in, so this is the only thing on screen while loading is true.
 */
export function AnalyzingStatus() {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderRadius: 8,
          background: "#171a23",
          border: "1px solid #2a2f3d",
          marginBottom: 20,
        }}
      >
        <span className="spinner" aria-hidden="true" />
        <span>Analizando repositorio… (clonar + detectar lenguajes + armar el grafo puede tardar unos segundos)</span>
      </div>

      <div className="skeleton-block" style={{ height: 20, width: 160, marginBottom: 10 }} />
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <div className="skeleton-block" style={{ height: 36, width: 140 }} />
        <div className="skeleton-block" style={{ height: 36, width: 100 }} />
        <div className="skeleton-block" style={{ height: 36, width: 120 }} />
      </div>

      <div className="skeleton-block" style={{ height: 20, width: 200, marginBottom: 10 }} />
      <div className="skeleton-block" style={{ height: 480, width: "100%" }} />
    </div>
  );
}
