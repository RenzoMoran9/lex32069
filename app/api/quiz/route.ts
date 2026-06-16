import { getContext } from "@/lib/context";
import { getModel, assertApiKey } from "@/lib/gemini";
import { buildSystemInstruction } from "@/lib/prompts";
import { extractJson } from "@/lib/json";

export const runtime = "nodejs";
export const maxDuration = 60;

type Quiz = {
  pregunta: string;
  opciones: { A: string; B: string; C: string; D: string };
  correcta: "A" | "B" | "C" | "D";
  explicacion: string;
  articulo: string;
};

export async function POST() {
  try {
    assertApiKey();

    const context = await getContext();
    const model = getModel(
      buildSystemInstruction(
        context,
        "Cuando se te pida generar una pregunta de quiz, responde ÚNICAMENTE con JSON válido, sin texto adicional ni bloques de código."
      )
    );

    // Una semilla aleatoria empuja al modelo a variar el artículo elegido.
    const seed = Math.floor(Math.random() * 100000);

    const prompt = `Genera UNA pregunta de opción múltiple para estudiar la Ley 32069 o su Reglamento, basada en un artículo elegido al azar (semilla: ${seed}). Varía el tema respecto a preguntas anteriores.

Devuelve EXCLUSIVAMENTE este JSON (sin texto adicional):
{
  "pregunta": "Enunciado claro de la pregunta",
  "opciones": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "correcta": "A",
  "explicacion": "Explicación breve de por qué esa es la respuesta correcta, citando el artículo.",
  "articulo": "Art. 45 — Ley 32069"
}

Reglas:
- "correcta" debe ser una de: "A", "B", "C", "D".
- Las 4 opciones deben ser plausibles y solo una correcta.
- La pregunta debe basarse en contenido real del contexto legal.
- No incluyas nada fuera del JSON.`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    const quiz = extractJson<Quiz | null>(raw, null);

    if (!quiz || !quiz.pregunta || !quiz.opciones || !quiz.correcta) {
      return Response.json(
        { error: "No se pudo generar la pregunta. Intenta de nuevo." },
        { status: 502 }
      );
    }

    return Response.json(quiz);
  } catch (err: any) {
    console.error("[/api/quiz] error:", err);
    return Response.json(
      { error: err?.message || "Error interno." },
      { status: 500 }
    );
  }
}
