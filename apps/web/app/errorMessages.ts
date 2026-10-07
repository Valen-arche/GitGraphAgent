export interface ApiError {
  code: string;
  message: string;
}

/**
 * Maps the API's stable `code` field to user-facing copy in Spanish. Switching on
 * `code` (not on the raw message string) is what lets us tell a permissions problem
 * apart from a real network failure instead of showing a generic "failed to fetch".
 */
export function describeError(code: string, fallbackMessage: string): string {
  switch (code) {
    case "repo_not_found_or_private":
      return "No encontramos ese repositorio: o no existe, o es privado y no tenemos acceso. Si es privado, por ahora esta herramienta solo analiza repos públicos.";
    case "repo_private":
      return "Ese repositorio es privado. Por ahora solo se pueden analizar repositorios públicos.";
    case "rate_limited":
      return "Se alcanzó el límite de consultas a la API de GitHub. Esperá unos minutos y probá de nuevo.";
    case "repo_too_large":
      return fallbackMessage;
    case "invalid_url":
      return fallbackMessage || "Esa URL no es un repositorio de GitHub válido (formato esperado: https://github.com/owner/repo).";
    case "network_error":
      return "No se pudo contactar a GitHub en este momento. Puede ser un problema de red temporal — probá de nuevo en unos segundos.";
    case "api_unreachable":
      return "No se pudo conectar con el servidor de análisis. Verificá que la API esté corriendo.";
    default:
      return fallbackMessage || "Ocurrió un error inesperado analizando el repositorio.";
  }
}
