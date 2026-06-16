import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

// pdf-parse trae en su index.js un bloque de "debug" que intenta leer un PDF
// de prueba al importarse, lo cual rompe en producción. Importamos el módulo
// interno directamente para evitarlo.
const require = createRequire(import.meta.url);

const PDF_DIR = path.resolve(process.cwd(), process.env.PDF_DIR || "./docs");
const CACHE_FILE = path.resolve(process.cwd(), ".context-cache", "context.txt");
const MAX_CONTEXT_CHARS = Number(process.env.MAX_CONTEXT_CHARS || 3_500_000);

const LEY_FILE = "ley-general-de-contrataciones-publicas-32069.pdf";
const REGLAMENTO_FILE =
  "reglamento-de-la-ley-general-de-contrataciones-publicas-32069.pdf";

// Singleton: cacheamos en memoria la promesa para no releer/reparsear los PDFs
// en cada request (los módulos de Node se evalúan una sola vez por proceso).
let contextPromise: Promise<string> | null = null;

async function extractPdf(filePath: string): Promise<string> {
  const pdfParse = require("pdf-parse/lib/pdf-parse.js");
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text as string;
}

async function buildContext(): Promise<string> {
  // 1. Si existe la caché en disco (generada con `npm run extract`), úsala.
  //    Es mucho más rápido y evita parsear PDFs grandes en arranques en frío.
  if (fs.existsSync(CACHE_FILE)) {
    console.log("[context] Usando caché de texto:", CACHE_FILE);
    return fs.readFileSync(CACHE_FILE, "utf8");
  }

  // 2. Si no hay caché, extraemos el texto de los PDFs en tiempo de ejecución.
  console.log("[context] Extrayendo texto de los PDFs en:", PDF_DIR);
  const leyPath = path.join(PDF_DIR, LEY_FILE);
  const reglamentoPath = path.join(PDF_DIR, REGLAMENTO_FILE);

  if (!fs.existsSync(leyPath)) {
    throw new Error(
      `No se encontró el PDF de la Ley en ${leyPath}. Revisa PDF_DIR en .env.local.`
    );
  }
  if (!fs.existsSync(reglamentoPath)) {
    throw new Error(
      `No se encontró el PDF del Reglamento en ${reglamentoPath}. Revisa PDF_DIR en .env.local.`
    );
  }

  const [ley, reglamento] = await Promise.all([
    extractPdf(leyPath),
    extractPdf(reglamentoPath),
  ]);

  const context =
    "=== LEY N° 32069 - LEY GENERAL DE CONTRATACIONES PÚBLICAS ===\n" +
    ley +
    "\n=== REGLAMENTO DS 009-2025-EF ===\n" +
    reglamento;

  console.log(
    `[context] Texto extraído: ${context.length.toLocaleString()} caracteres ` +
      `(~${Math.round(context.length / 4).toLocaleString()} tokens aprox.)`
  );

  return context;
}

/**
 * Retorna el texto completo de la Ley 32069 + Reglamento como un solo string.
 * Se cachea en memoria; la primera llamada parsea los PDFs (o lee la caché).
 */
export async function getContext(): Promise<string> {
  if (!contextPromise) {
    contextPromise = buildContext().catch((err) => {
      // Si falla, reseteamos para reintentar en el siguiente request.
      contextPromise = null;
      throw err;
    });
  }

  let context = await contextPromise;

  // Salvaguarda: si el texto supera el límite, lo recortamos para no exceder
  // el contexto del modelo. (Gemini 1.5 Pro ≈ 1M tokens ≈ ~4M caracteres.)
  if (context.length > MAX_CONTEXT_CHARS) {
    context =
      context.slice(0, MAX_CONTEXT_CHARS) +
      "\n\n[... contexto truncado por límite de tamaño ...]";
  }

  return context;
}
