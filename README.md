# ⚖️ LEX32069

Asistente personal para **estudiar y consultar la Ley General de Contrataciones Públicas del Perú (Ley N° 32069)** y su **Reglamento (Decreto Supremo N° 009-2025-EF)**.

Construido con Next.js 14 + Tailwind + Google Gemini. El texto completo de ambos PDFs se carga en memoria y se inyecta como contexto en cada consulta, así que las respuestas citan los artículos exactos.

## ✨ Módulos

| Tab | Descripción |
|-----|-------------|
| 💬 **Chatbot** | Chat estilo ChatGPT con respuestas en streaming, historial en el sidebar y guardado en `localStorage`. |
| 📋 **Resúmenes** | 12 temas clave predefinidos. Un clic genera un resumen estructurado (cacheado en `localStorage`). |
| 🔍 **Buscador** | Encuentra los fragmentos/artículos más relevantes. Botón "Ver en contexto" abre el chat con esa consulta. |
| 🧠 **Quiz** | Preguntas de opción múltiple generadas por IA, feedback inmediato y estadísticas (aciertos, racha, %). |

---

## 1. Requisitos previos

- **Node.js 18 o superior** (recomendado 20+). Verifica con:
  ```bash
  node --version
  ```
- Una **API Key de Google Gemini** (gratis, ver siguiente paso).
- Los dos PDFs ya incluidos en la carpeta [`/docs`](./docs):
  - `ley-general-de-contrataciones-publicas-32069.pdf`
  - `reglamento-de-la-ley-general-de-contrataciones-publicas-32069.pdf`

## 2. Obtener la Gemini API Key (gratis)

1. Entra a **https://aistudio.google.com/apikey** e inicia sesión con tu cuenta de Google.
2. Haz clic en **"Create API key"** (Crear clave de API).
3. Copia la clave generada. La usarás en el siguiente paso.

> El plan gratuito de Gemini incluye una cuota diaria suficiente para uso personal.

## 3. Instalar dependencias

```bash
npm install
```

## 4. Configurar variables de entorno

Copia el archivo de ejemplo y edítalo:

```bash
# Windows (PowerShell)
copy .env.local.example .env.local

# macOS / Linux
cp .env.local.example .env.local
```

Abre `.env.local` y pega tu clave:

```env
GEMINI_API_KEY=tu_key_real_aqui
PDF_DIR=./docs
GEMINI_MODEL=gemini-2.5-pro
MAX_CONTEXT_CHARS=3500000
```

### ⚠️ Importante: billing y modelos

Los dos PDFs juntos suman **~345.000 tokens** y se inyectan completos en cada llamada. Esto **requiere tener el billing activado** en la API de Gemini:

- **Con billing (pago por uso, recomendado):** usa `GEMINI_MODEL=gemini-2.5-pro` (o `gemini-2.5-flash` para más velocidad/menor costo). Contexto completo, sin límite práctico de tokens/minuto. El costo es de centavos por consulta.
- **Sin billing (free tier):** el free tier solo permite **250.000 tokens/minuto** con `gemini-2.5-flash`. Como el contexto completo no cabe, debes usar:
  ```env
  GEMINI_MODEL=gemini-2.5-flash
  MAX_CONTEXT_CHARS=900000
  ```
  Esto **recorta ~43% del Reglamento** y limita a ~1 consulta por minuto. Funciona para probar, pero no es ideal.

**Cómo activar el billing:** entra a [Google AI Studio → Billing](https://aistudio.google.com/) (o a [Google Cloud Console](https://console.cloud.google.com/billing) en el proyecto de tu API key), agrega un método de pago y vincula el proyecto. Tras activarlo, reinicia `npm run dev`.

> Los modelos `gemini-1.5-*` ya fueron descontinuados por Google y devuelven error 404. Usa los `gemini-2.5-*`.

## 5. Correr en local

```bash
npm run dev
```

Abre **http://localhost:3000**.

> La **primera** consulta tarda unos segundos porque extrae el texto de los PDFs. A partir de ahí queda cacheado en memoria.

**Opcional (recomendado):** pre-extrae el texto a una caché en disco para arranques instantáneos:

```bash
npm run extract
```

Esto genera `.context-cache/context.txt`. Si ese archivo existe, la app lo usa en vez de re-parsear los PDFs.

---

## 6. Deploy en Vercel (gratis) — paso a paso

### a) Sube el proyecto a GitHub

```bash
git init
git add .
git commit -m "LEX32069 inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/lex32069.git
git push -u origin main
```

> Los PDFs en `/docs` **sí** se suben al repo (son necesarios para el deploy). El archivo `.env.local` **no** se sube (está en `.gitignore`).

### b) Conecta el repo a Vercel

1. Entra a **https://vercel.com** e inicia sesión con GitHub.
2. **Add New → Project** y selecciona tu repositorio `lex32069`.
3. Vercel detecta Next.js automáticamente. No cambies el build command.
4. En **Environment Variables**, agrega:
   | Name | Value |
   |------|-------|
   | `GEMINI_API_KEY` | tu clave de Gemini |
   | `GEMINI_MODEL` | `gemini-1.5-pro` (opcional) |
5. Haz clic en **Deploy**.

Durante el build, el script `prebuild` extrae el texto de los PDFs y lo guarda en la caché (`.context-cache`), que se incluye en las funciones serverless. Así las respuestas son rápidas desde el primer request.

¡Listo! Vercel te dará una URL pública tipo `https://lex32069.vercel.app`.

---

## 7. Actualizar los PDFs (nuevas modificaciones a la ley)

Cuando salga una modificación a la Ley o al Reglamento:

1. Reemplaza el/los PDF en la carpeta [`/docs`](./docs) **manteniendo el mismo nombre de archivo**.
   - Si el nombre cambia, actualízalo en `lib/context.ts` y `scripts/extract-pdfs.mjs` (constantes `LEY_FILE` / `REGLAMENTO_FILE`).
2. Regenera la caché local:
   ```bash
   npm run extract
   ```
3. Sube los cambios a GitHub:
   ```bash
   git add docs/ && git commit -m "Actualiza PDFs de la ley" && git push
   ```
4. Vercel hará redeploy automático y re-extraerá el texto durante el build.

---

## 🗂️ Estructura del proyecto

```
lex32069/
├── app/
│   ├── api/
│   │   ├── chat/route.ts        # POST { messages, question } → respuesta en streaming
│   │   ├── summary/route.ts     # POST { topic } → resumen estructurado
│   │   ├── search/route.ts      # POST { query } → fragmentos relevantes (JSON)
│   │   └── quiz/route.ts        # POST → pregunta de opción múltiple (JSON)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Tabs + estado global
├── components/
│   ├── Header.tsx
│   ├── Markdown.tsx
│   ├── Modal.tsx
│   └── tabs/
│       ├── Chatbot.tsx
│       ├── Resumenes.tsx
│       ├── Buscador.tsx
│       └── Quiz.tsx
├── lib/
│   ├── context.ts               # Singleton: extrae y cachea el texto de los PDFs
│   ├── gemini.ts                # Cliente de Gemini
│   ├── prompts.ts               # Instrucciones del sistema
│   ├── json.ts                  # Parseo tolerante de JSON del modelo
│   └── utils.ts
├── scripts/
│   └── extract-pdfs.mjs         # Pre-extracción de texto (npm run extract)
├── docs/                        # Los dos PDFs de la ley
├── .env.local.example
├── next.config.mjs
├── tailwind.config.ts
└── vercel.json
```

## 🔧 Notas técnicas

- **Contexto de 1M tokens:** Gemini 1.5 Pro soporta ~1 millón de tokens, suficiente para ambos PDFs completos. `MAX_CONTEXT_CHARS` recorta el texto como salvaguarda si fuera excesivo.
- **Sin base de datos:** todo el historial (conversaciones, resúmenes, estadísticas del quiz) vive en `localStorage` del navegador.
- **Runtime Node.js:** las rutas API usan `runtime = "nodejs"` porque `pdf-parse` necesita APIs de Node.
- **Streaming:** `/api/chat` devuelve la respuesta progresivamente, igual que ChatGPT.

## ⚠️ Disclaimer

LEX32069 es una herramienta de estudio asistida por IA. Puede cometer errores. **Verifica siempre los artículos citados con la fuente oficial** antes de tomar decisiones legales.
