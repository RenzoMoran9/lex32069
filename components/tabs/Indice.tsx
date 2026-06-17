"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FileText, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ArticleMeta = { num: number; title: string };
type Titulo = { id: string; label: string; name: string; articles: ArticleMeta[] };
type DocTree = { doc: "ley" | "reglamento"; name: string; titulos: Titulo[]; totalArticles: number };
type Structure = { ley: DocTree; reglamento: DocTree };
type ArticleDetail = { doc: string; docName: string; num: number; title: string; body: string };

export function Indice({ onOpenInChat }: { onOpenInChat: (q: string) => void }) {
  const [structure, setStructure] = useState<Structure | null>(null);
  const [doc, setDoc] = useState<"ley" | "reglamento">("ley");
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<{ doc: "ley" | "reglamento"; num: number } | null>(null);
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/index")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setStructure(d);
      })
      .catch((e) => setError(e.message || "No se pudo cargar el índice."));
  }, []);

  const tree = structure?.[doc];

  const filteredTitulos = useMemo(() => {
    if (!tree) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return tree.titulos;
    return tree.titulos
      .map((t) => ({
        ...t,
        articles: t.articles.filter(
          (a) =>
            a.title.toLowerCase().includes(q) || String(a.num).includes(q)
        ),
      }))
      .filter((t) => t.articles.length > 0);
  }, [tree, filter]);

  async function openArticle(d: "ley" | "reglamento", num: number) {
    setSelected({ doc: d, num });
    setArticle(null);
    setLoadingArticle(true);
    try {
      const res = await fetch(`/api/article?doc=${d}&num=${num}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo cargar el artículo.");
      setArticle(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingArticle(false);
    }
  }

  if (error && !structure) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center text-sm text-red-300">
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Lista (master) */}
      <div
        className={cn(
          "flex w-full flex-col border-r border-border md:w-[360px]",
          selected && "hidden md:flex"
        )}
      >
        <div className="border-b border-border p-3">
          <div className="mb-2 flex rounded-lg border border-border bg-card p-1">
            {(["ley", "reglamento"] as const).map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDoc(d);
                  setFilter("");
                }}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  doc === d
                    ? "bg-accent-blue text-white"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {d === "ley" ? "Ley 32069" : "Reglamento"}
              </button>
            ))}
          </div>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar por número o título..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent-blue"
          />
          {tree && (
            <p className="mt-2 text-[11px] text-slate-500">
              {tree.totalArticles} artículos · {tree.titulos.length} títulos
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {!structure && (
            <div className="space-y-2 p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-9 w-full" />
              ))}
            </div>
          )}

          {filteredTitulos.map((t) => {
            const isOpen = filter.trim() ? true : open[t.id];
            return (
              <div key={t.id} className="mb-1">
                <button
                  onClick={() => setOpen((o) => ({ ...o, [t.id]: !o[t.id] }))}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300 hover:bg-slate-800"
                >
                  {isOpen ? (
                    <ChevronDown size={14} className="shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="shrink-0" />
                  )}
                  <span className="text-accent-blue">{t.label}</span>
                  {t.name && (
                    <span className="truncate font-normal normal-case text-slate-500">
                      · {t.name}
                    </span>
                  )}
                </button>
                {isOpen && (
                  <div className="ml-3 border-l border-border pl-2">
                    {t.articles.map((a) => (
                      <button
                        key={a.num}
                        onClick={() => openArticle(doc, a.num)}
                        className={cn(
                          "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                          selected?.doc === doc && selected?.num === a.num
                            ? "bg-slate-700/60 text-slate-100"
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        )}
                      >
                        <span className="shrink-0 font-mono text-xs text-slate-500">
                          {a.num}
                        </span>
                        <span className="leading-snug">{a.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lector (detail) */}
      <div
        className={cn(
          "flex-1 overflow-y-auto",
          !selected && "hidden md:block"
        )}
      >
        {!selected && (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-slate-500">
            <FileText size={40} className="mb-3 text-slate-600" />
            <p className="text-sm">Selecciona un artículo para leerlo.</p>
          </div>
        )}

        {selected && (
          <div className="mx-auto max-w-2xl px-4 py-6">
            <button
              onClick={() => setSelected(null)}
              className="mb-4 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 md:hidden"
            >
              <X size={14} /> Volver al índice
            </button>

            {loadingArticle && (
              <div className="space-y-3">
                <div className="skeleton h-6 w-2/3" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-11/12" />
                <div className="skeleton h-4 w-4/5" />
              </div>
            )}

            {article && (
              <article>
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-accent-blue">
                  {article.docName}
                </div>
                <h2 className="text-xl font-bold text-slate-100">
                  Artículo {article.num}. {article.title}
                </h2>
                <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                  {article.body}
                </div>
                <button
                  onClick={() =>
                    onOpenInChat(
                      `Explícame el Artículo ${article.num} (${article.docName}) con un ejemplo sencillo.`
                    )
                  }
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                >
                  <MessageSquare size={15} /> Explícame este artículo
                </button>
              </article>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
