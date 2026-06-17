import { NextRequest } from "next/server";
import { getArticle, type DocKey } from "@/lib/lawIndex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doc = searchParams.get("doc") as DocKey | null;
    const num = Number(searchParams.get("num"));

    if ((doc !== "ley" && doc !== "reglamento") || !num) {
      return Response.json(
        { error: "Parámetros inválidos. Usa ?doc=ley|reglamento&num=N" },
        { status: 400 }
      );
    }

    const article = await getArticle(doc, num);
    if (!article) {
      return Response.json({ error: "Artículo no encontrado." }, { status: 404 });
    }

    return Response.json(article);
  } catch (err: any) {
    console.error("[/api/article] error:", err);
    return Response.json(
      { error: err?.message || "Error interno." },
      { status: 500 }
    );
  }
}
