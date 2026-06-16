import { NextRequest } from "next/server";
import { getContext } from "@/lib/context";
import { getModel, assertApiKey } from "@/lib/gemini";
import { buildSystemInstruction } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

type Message = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  try {
    assertApiKey();
    const { messages = [], question } = (await req.json()) as {
      messages?: Message[];
      question: string;
    };

    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "Falta 'question'." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const context = await getContext();
    const model = getModel(buildSystemInstruction(context));

    // Construimos el historial en el formato de Gemini.
    const history = messages
      .filter((m) => m.content?.trim())
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const contents = [
      ...history,
      { role: "user", parts: [{ text: question }] },
    ];

    const result = await model.generateContentStream({ contents });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (err) {
          console.error("[/api/chat] stream error:", err);
          controller.enqueue(
            encoder.encode("\n\n_[Error generando la respuesta.]_")
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: any) {
    console.error("[/api/chat] error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Error interno." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
