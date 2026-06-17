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
    const { topic } = (await req.json()) as { topic?: string };

    if (!topic) {
      return Response.json({ error: "Falta 'topic'." }, { status: 400 });
    }

    const context = await getContext();
    const model = getModel(
      buildSystemInstruction(
        context,
        "Cuando se te pidan flashcards, responde ÚNICAMENTE con JSON válido, sin texto adicional ni bloques de código."
      )
    );

    const seed = Math.floor(Math.random() * 100000);
    const prompt = `Genera tarjetas de estudio (flashcards) sobre el tema "${topic}", basadas en la Ley 32069 y su Reglamento. Varía las tarjetas (semilla: ${seed}).

Devuelve EXCLUSIVAMENTE un arreglo JSON de 8 tarjetas con este formato:
[
  { "frente": "Concepto, pregunta o término breve", "reverso": "Definición o respuesta clara y concisa", "articulo": "Art. 11 — Ley 32069" }
]

Reglas:
- "frente": corto (un término, sigla o pregunta puntual).
- "reverso": la definición/respuesta, fiel al contexto legal.
- "articulo": la fuente exacta cuando aplique.
- Exactamente 8 tarjetas. No incluyas texto fuera del JSON.`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const cards = extractJson<any[]>(raw, []);

    return Response.json({ topic, cards: Array.isArray(cards) ? cards : [] });
  } catch (err: any) {
    console.error("[/api/flashcards] error:", err);
    return Response.json(
      { error: err?.message || "Error interno." },
      { status: 500 }
    );
  }
}
