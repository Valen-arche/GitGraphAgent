# Git Graph Agent

Transforma un repositorio de GitHub en una radiografía visual del software: lenguajes, estructura, módulos y sus dependencias — sin tener que leer cientos de archivos para entenderlo.

## Estado actual (Sprint 0)

En desarrollo. Por ahora `packages/analysis-core` implementa, de forma determinística y sin ejecutar código del repo analizado:

- **`ingest`**: valida que la URL sea `https://github.com/{owner}/{repo}`, consulta la API de GitHub para rechazar repos privados u oversized antes de clonar, y hace un shallow clone (`--depth 1`) a un directorio temporal que siempre se limpia.
- **`language-detector`**: recorre el árbol de archivos (ignorando `node_modules`, `dist`, `.git`, etc.) y calcula porcentaje de líneas por lenguaje.

Todavía no incluye: grafo de dependencias entre módulos, seguridad, IA, agentes, ni persistencia. Ver el roadmap en la discusión de diseño del proyecto.

## Estructura

```
packages/
  analysis-core/   → lógica de análisis, sin HTTP, reusable desde cualquier cliente
apps/
  api/             → (próximamente) expone analysis-core vía HTTP
  web/             → (próximamente) dashboard Next.js
```

## Desarrollo

```bash
pnpm install
pnpm --filter @git-graph-agent/analysis-core test
```

## Principios de diseño

- El core de análisis nunca ejecuta código del repositorio analizado.
- Todo repo externo se trata como entrada no confiable (ver validación de URL, límites de tamaño, timeouts de clone).
- El core es independiente de cualquier interfaz (web, API, CLI) — misma lógica, múltiples clientes futuros.
