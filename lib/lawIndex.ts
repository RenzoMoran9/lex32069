import { getContext } from "./context";

export type DocKey = "ley" | "reglamento";

export type ArticleMeta = { num: number; title: string };
export type Titulo = { id: string; label: string; name: string; articles: ArticleMeta[] };
export type DocTree = { doc: DocKey; name: string; titulos: Titulo[]; totalArticles: number };
export type LawStructure = { ley: DocTree; reglamento: DocTree };

export type ArticleDetail = {
  doc: DocKey;
  docName: string;
  num: number;
  title: string;
  body: string;
};

const LEY_NAME = "Ley 32069";
const REGLAMENTO_NAME = "Reglamento DS 009-2025-EF";
const REGLAMENTO_MARKER = "=== REGLAMENTO DS 009-2025-EF ===";

const ROMAN = /^[IVXLCDM]+$/i;

// Encabezado real de artículo: "Artículo 12. Nombre del artículo".
// Exigimos el punto tras el número y que el título empiece en mayúscula,
// para descartar referencias como "artículo 94 de la Constitución".
const ARTICLE_RE =
  /(?:^|\n)[ \t]*Art[íi]culo[ \t]+(\d+)[ \t]*\.[ \t]*([A-ZÁÉÍÓÚÑ][^\n]{0,120})/g;

const TITULO_RE = /(?:^|\n)[ \t]*T[ÍI]TULO[ \t]+([IVXLCDM]+)\b[ \t]*\n?/g;

function fixLigatures(s: string): string {
  // pdf-parse separa las ligaduras "fi"/"fl" con un espacio (defi nitivo, a fi n).
  return s
    .replace(/(\p{L})f([il]) (\p{L})/gu, "$1f$2$3") // mediopalabra: definiciones, influencia
    .replace(/(\s)f([il]) (\p{L})/gu, "$1f$2$3"); // standalone: a fi n -> a fin
}

function clean(s: string): string {
  // pdf-parse a veces mete espacios dobles; los colapsamos.
  return fixLigatures(s.replace(/[ \t]{2,}/g, " ")).replace(/\s+$/g, "").trim();
}

type RawArticle = { num: number; title: string; start: number };

function parseDoc(text: string, doc: DocKey, name: string): {
  tree: DocTree;
  bodies: Map<number, ArticleDetail>;
} {
  // 1. Artículos (monótonos crecientes para descartar referencias cruzadas).
  const articles: RawArticle[] = [];
  let m: RegExpExecArray | null;
  let lastNum = 0;
  ARTICLE_RE.lastIndex = 0;
  while ((m = ARTICLE_RE.exec(text))) {
    const num = parseInt(m[1], 10);
    // Aceptamos solo si avanza la numeración (tolerando saltos hacia adelante).
    if (num === lastNum + 1 || (num > lastNum && num <= lastNum + 3)) {
      articles.push({
        num,
        title: clean(m[2]),
        start: m.index + (m[0].startsWith("\n") ? 1 : 0),
      });
      lastNum = num;
    }
  }

  // 2. Posiciones de los TÍTULOS.
  const tituloPositions: { roman: string; index: number; name: string }[] = [];
  TITULO_RE.lastIndex = 0;
  while ((m = TITULO_RE.exec(text))) {
    const roman = m[1].toUpperCase();
    if (!ROMAN.test(roman)) continue;
    // Nombre del título: siguiente línea no vacía que no sea CAPÍTULO/artículo.
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 300);
    const lines = after.split("\n").map((l) => l.trim()).filter(Boolean);
    // El nombre del título puede ocupar varias líneas (mayúsculas); las unimos
    // hasta toparnos con un CAPÍTULO / artículo o con texto en minúsculas.
    const parts: string[] = [];
    for (const l of lines) {
      if (/^(CAP[ÍI]TULO|SUBCAP[ÍI]TULO|Art[íi]culo)/i.test(l)) break;
      // Una línea de nombre de título suele ir en MAYÚSCULAS.
      if (!/[A-ZÁÉÍÓÚÑ]/.test(l) || /[a-záéíóúñ]/.test(l.replace(/\b(de|la|el|los|las|y|del|en|para|por|a)\b/gi, ""))) {
        if (parts.length) break;
      }
      parts.push(l);
      if (parts.join(" ").length > 70) break;
    }
    const tname = clean(parts.join(" "));
    tituloPositions.push({ roman, index: m.index, name: tname });
  }

  // 3. Cuerpo de cada artículo: del inicio del artículo al inicio del siguiente.
  const bodies = new Map<number, ArticleDetail>();
  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const end = i + 1 < articles.length ? articles[i + 1].start : text.length;
    const raw = text.slice(a.start, end);
    // Quitamos el encabezado "Artículo N." del cuerpo.
    let body = clean(raw.replace(/^[ \t]*Art[íi]culo[ \t]+\d+[ \t]*\./, ""));
    // Y el título duplicado que suele quedar al inicio.
    if (a.title && body.toLowerCase().startsWith(a.title.toLowerCase())) {
      body = body.slice(a.title.length).replace(/^[\s.·:-]+/, "").trim();
    }
    bodies.set(a.num, { doc, docName: name, num: a.num, title: a.title, body });
  }

  // 4. Agrupar artículos por título según posición.
  const titulos: Titulo[] = [];
  if (tituloPositions.length === 0) {
    titulos.push({
      id: `${doc}-t0`,
      label: "Articulado",
      name: "",
      articles: articles.map((a) => ({ num: a.num, title: a.title })),
    });
  } else {
    for (let i = 0; i < tituloPositions.length; i++) {
      const tp = tituloPositions[i];
      const tStart = tp.index;
      const tEnd =
        i + 1 < tituloPositions.length ? tituloPositions[i + 1].index : text.length;
      const arts = articles
        .filter((a) => a.start >= tStart && a.start < tEnd)
        .map((a) => ({ num: a.num, title: a.title }));
      if (arts.length === 0) continue;
      titulos.push({
        id: `${doc}-t${tp.roman}`,
        label: `Título ${tp.roman}`,
        name: tp.name,
        articles: arts,
      });
    }
    // Artículos antes del primer título (disposiciones preliminares).
    const firstIdx = tituloPositions[0].index;
    const pre = articles
      .filter((a) => a.start < firstIdx)
      .map((a) => ({ num: a.num, title: a.title }));
    if (pre.length) {
      titulos.unshift({
        id: `${doc}-t-pre`,
        label: "Disposiciones",
        name: "",
        articles: pre,
      });
    }
  }

  const tree: DocTree = {
    doc,
    name,
    titulos,
    totalArticles: articles.length,
  };
  return { tree, bodies };
}

let cache: {
  structure: LawStructure;
  bodies: Record<DocKey, Map<number, ArticleDetail>>;
} | null = null;

async function build() {
  if (cache) return cache;
  const full = await getContext();
  const splitAt = full.indexOf(REGLAMENTO_MARKER);
  const leyText = splitAt >= 0 ? full.slice(0, splitAt) : full;
  const reglText = splitAt >= 0 ? full.slice(splitAt) : "";

  const ley = parseDoc(leyText, "ley", LEY_NAME);
  const reglamento = parseDoc(reglText, "reglamento", REGLAMENTO_NAME);

  cache = {
    structure: { ley: ley.tree, reglamento: reglamento.tree },
    bodies: { ley: ley.bodies, reglamento: reglamento.bodies },
  };
  return cache;
}

export async function getStructure(): Promise<LawStructure> {
  return (await build()).structure;
}

export async function getArticle(
  doc: DocKey,
  num: number
): Promise<ArticleDetail | null> {
  const c = await build();
  return c.bodies[doc]?.get(num) || null;
}
