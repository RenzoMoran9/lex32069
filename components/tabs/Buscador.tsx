"use client";

import { useState } from "react";
import { Search, ArrowRight, BookOpen } from "lucide-react";

type Result = { articulo: string; texto: string; fuente: string };

export function Buscador({
  onOpenInChat,
}: {
  onOpenInChat: (query: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;

    setLoading(true);
    setError("");
    setResults(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error en la búsqueda.");
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-100">Buscador</h1>
        <p className="mt-1 text-sm text-slate-400">
          Encuentra los artículos y fragmentos más relevantes de la Ley y el
          Reglamento.
        </p>
      </div>

      <form onSubmit={search} className="mb-6">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2 focus-within:border-accent-blue">
          <Search size={18} className="ml-2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: garantía de fiel cumplimiento, plazos de impugnación..."
            className="flex-1 bg-transparent px-1 py-1.5 text-sm text-slate-100 outline-none placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-40"
          >
            Buscar
          </button>
        </div>
      </form>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="skeleton mb-3 h-4 w-24" />
              <div className="skeleton mb-2 h-3 w-full" />
              <div className="skeleton h-3 w-4/5" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          ⚠️ {error}
        </div>
      )}

      {results && results.length === 0 && !loading && (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-slate-400">
          No se encontraron resultados para esa búsqueda.
        </div>
      )}

      {results && results.length > 0 && (
        <div className="space-y-3">
          {results.map((r, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-slate-500"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-accent-blue/15 px-2 py-0.5 text-xs font-semibold text-accent-blue">
                  <BookOpen size={12} /> {r.articulo}
                </span>
                <span className="rounded-md bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300">
                  {r.fuente}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-300">{r.texto}</p>
              <button
                onClick={() =>
                  onOpenInChat(
                    `Explícame en detalle ${r.articulo} (${r.fuente}) sobre: ${query}`
                  )
                }
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent-green transition-colors hover:text-green-400"
              >
                Ver en contexto <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
