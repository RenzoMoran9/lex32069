import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-pro";

if (!apiKey) {
  // No lanzamos aquí para no romper el build; las rutas API validan en runtime.
  console.warn(
    "[gemini] Falta GEMINI_API_KEY. Configúrala en .env.local o en Vercel."
  );
}

const genAI = new GoogleGenerativeAI(apiKey || "");

/**
 * Devuelve un modelo de Gemini con el systemInstruction indicado.
 * El contexto de los PDFs se inyecta como systemInstruction.
 */
export function getModel(systemInstruction: string) {
  return genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction,
  });
}

export function assertApiKey() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "Falta GEMINI_API_KEY. Configúrala en .env.local (local) o en las variables de entorno de Vercel."
    );
  }
}

export const GEMINI_MODEL = MODEL;
