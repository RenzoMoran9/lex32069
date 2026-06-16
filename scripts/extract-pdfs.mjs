// Extrae el texto de los PDFs una sola vez y lo guarda en .context-cache/context.txt
// Úsalo ANTES de hacer deploy a Vercel para evitar parsear PDFs grandes en cada
// arranque en frío de la función serverless:
//
//   npm run extract
//
// El módulo lib/context.ts usará automáticamente esta caché si existe.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// Importamos directamente el módulo interno para evitar el código de debug
// de pdf-parse que intenta leer un PDF de prueba al importar el index.
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const PDF_DIR = path.resolve(ROOT, process.env.PDF_DIR || "./docs");
const CACHE_DIR = path.resolve(ROOT, ".context-cache");
const CACHE_FILE = path.join(CACHE_DIR, "context.txt");

const LEY_FILE = "ley-general-de-contrataciones-publicas-32069.pdf";
const REGLAMENTO_FILE =
  "reglamento-de-la-ley-general-de-contrataciones-publicas-32069.pdf";

async function extractPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

async function main() {
  console.log("📄 Extrayendo texto de los PDFs en:", PDF_DIR);

  const leyPath = path.join(PDF_DIR, LEY_FILE);
  const reglamentoPath = path.join(PDF_DIR, REGLAMENTO_FILE);

  if (!fs.existsSync(leyPath)) throw new Error("No se encontró la Ley: " + leyPath);
  if (!fs.existsSync(reglamentoPath))
    throw new Error("No se encontró el Reglamento: " + reglamentoPath);

  console.log("  → Procesando Ley 32069...");
  const ley = await extractPdf(leyPath);
  console.log("  → Procesando Reglamento DS 009-2025-EF...");
  const reglamento = await extractPdf(reglamentoPath);

  const context =
    "=== LEY N° 32069 - LEY GENERAL DE CONTRATACIONES PÚBLICAS ===\n" +
    ley +
    "\n=== REGLAMENTO DS 009-2025-EF ===\n" +
    reglamento;

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, context, "utf8");

  const chars = context.length;
  const approxTokens = Math.round(chars / 4);
  console.log("✅ Caché generada:", CACHE_FILE);
  console.log(
    `   ${chars.toLocaleString()} caracteres (~${approxTokens.toLocaleString()} tokens aprox.)`
  );
}

main().catch((err) => {
  console.error("❌ Error extrayendo PDFs:", err);
  process.exit(1);
});
