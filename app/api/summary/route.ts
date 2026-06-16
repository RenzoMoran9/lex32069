import { NextRequest } from "next/server";
import { getContext } from "@/lib/context";
import { getModel, assertApiKey } from "@/lib/gemini";
import { buildSystemInstruction } from "@/lib/prompts";

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
    const model = getModel(buildSystemInstruction(context));

    const prompt = `Genera un resumen estructurado y completo sobre el tema: "${topic}", basándote en la Ley 32069 y su Reglamento.

Estructura el resumen en Markdown así:
- Un título principal con el tema.
- Subtítulos (##) para cada subtema relevante.
- Listas con los puntos clave.
- Al final, una sección "### Artículos de referencia" listando los artículos exactos citados (con su fuente: Ley 32069 o Reglamento DS 009-2025-EF).

Sé conciso pero completo. Usa solo información del contexto legal proporcionado.`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return Response.json({ topic, summary });
  } catch (err: any) {
    console.error("[/api/summary] error:", err);
    return Response.json(
      { error: err?.message || "Error interno." },
      { status: 500 }
    );
  }
}
