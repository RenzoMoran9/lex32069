/**
 * Extrae y parsea JSON de la respuesta de un modelo, tolerando que venga
 * envuelto en bloques de código markdown (```json ... ```) o con texto extra.
 */
export function extractJson<T>(raw: string, fallback: T): T {
  if (!raw) return fallback;

  // Quita fences de markdown si existen.
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) text = fenceMatch[1].trim();

  // Intento directo.
  try {
    return JSON.parse(text) as T;
  } catch {
    // continúa
  }

  // Intenta recortar al primer { o [ y su cierre correspondiente.
  const firstObj = text.indexOf("{");
  const firstArr = text.indexOf("[");
  let start = -1;
  let openChar = "";
  if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) {
    start = firstArr;
    openChar = "[";
  } else if (firstObj !== -1) {
    start = firstObj;
    openChar = "{";
  }

  if (start !== -1) {
    const closeChar = openChar === "[" ? "]" : "}";
    const end = text.lastIndexOf(closeChar);
    if (end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as T;
      } catch {
        // continúa
      }
    }
  }

  return fallback;
}
