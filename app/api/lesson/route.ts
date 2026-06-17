import { NextRequest } from "next/server";
import { getContext } from "@/lib/context";
import { getModel, assertApiKey } from "@/lib/gemini";
import { buildSystemInstruction } from "@/lib/prompts";
import { extractJson } from "@/lib/json";
import { findLesson } from "@/lib/curriculum";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    assertApiKey();
    const { lessonId } = (await req.json()) as { lessonId?: string };
    const lesson = lessonId ? findLesson(lessonId) : undefined;

    if (!lesson) {
      return Response.json({ error: "Lección no encontrada." }, { status: 400 });
    }

    const context = await getContext();
    const model = getModel(
      buildSystemInstruction(
        context,
        "Cuando se te pida generar una lección, responde ÚNICAMENTE con JSON válido, sin texto adicional ni bloques de código."
      )
    );

    const prompt = `Genera una lección de estudio sobre el tema: "${lesson.topic}", basada en la Ley 32069 y su Reglamento.

Devuelve EXCLUSIVAMENTE este JSON:
{
  "introduccion": "Párrafo introductorio claro (markdown permitido).",
  "puntosClave": ["Punto clave 1", "Punto clave 2", "Punto clave 3", "Punto clave 4", "Punto clave 5"],
  "articulos": ["Art. 11 — Ley 32069", "Art. 120 — Reglamento DS 009-2025-EF"],
  "quiz": [
    {
      "pregunta": "Pregunta de comprensión sobre la lección",
      "opciones": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correcta": "A",
      "explicacion": "Por qué es correcta, citando el artículo."
    }
  ]
}

Reglas:
- "puntosClave": entre 4 y 6 puntos concisos.
- "articulos": los artículos más relevantes con su fuente exacta.
- "quiz": exactamente 2 preguntas de opción múltiple sobre el contenido de la lección.
- Basa TODO en el contexto legal. No inventes.
- No incluyas texto fuera del JSON.`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const data = extractJson<any>(raw, null);

    if (!data || !data.puntosClave) {
      return Response.json(
        { error: "No se pudo generar la lección. Intenta de nuevo." },
        { status: 502 }
      );
    }

    return Response.json({
      id: lesson.id,
      title: lesson.title,
      ...data,
    });
  } catch (err: any) {
    console.error("[/api/lesson] error:", err);
    return Response.json(
      { error: err?.message || "Error interno." },
      { status: 500 }
    );
  }
}
