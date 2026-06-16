import { NextRequest } from "next/server";
import { getContext } from "@/lib/context";
import { getModel, assertApiKey } from "@/lib/gemini";
import { buildSystemInstruction } from "@/lib/prompts";
import { extractJson } from "@/lib/json";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    assertApiKey();
    const { query } = (await req.json()) as { query?: string };

    if (!query) {
      return Response.json({ error: "Falta 'query'." }, { status: 400 });
    }

    const context = await getContext();
    const model = getModel(
      buildSystemInstruction(
        context,
        "Cuando se te pida buscar, responde ÚNICAMENTE con JSON válido, sin texto adicional ni bloques de código."
      )
    );

    const prompt = `Busca en la Ley 32069 y su Reglamento los fragmentos más relevantes para la siguiente consulta: "${query}".

Devuelve EXCLUSIVAMENTE un arreglo JSON (máximo 6 resultados) con este formato exacto:
[
  {
    "articulo": "Art. 45",
    "texto": "Texto literal o resumen muy fiel del fragmento relevante...",
    "fuente": "Ley 32069"
  }
]

Reglas:
- "fuente" debe ser exactamente "Ley 32069" o "Reglamento DS 009-2025-EF".
- "texto" debe ser fiel al contenido del artículo, no inventes.
- Si no hay resultados relevantes, devuelve un arreglo vacío [].
- No incluyas ningún texto fuera del JSON.`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    const results = extractJson<any[]>(raw, []);

    return Response.json({ query, results: Array.isArray(results) ? results : [] });
  } catch (err: any) {
    console.error("[/api/search] error:", err);
    return Response.json(
      { error: err?.message || "Error interno." },
      { status: 500 }
    );
  }
}
