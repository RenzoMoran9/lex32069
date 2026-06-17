import { getStructure } from "@/lib/lawIndex";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  try {
    const structure = await getStructure();
    return Response.json(structure);
  } catch (err: any) {
    console.error("[/api/index] error:", err);
    return Response.json(
      { error: err?.message || "Error interno." },
      { status: 500 }
    );
  }
}
