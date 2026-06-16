"use client";

import { useState } from "react";
import {
  FileText,
  Gavel,
  AlertTriangle,
  Users,
  Scale,
  FilePenLine,
  ShieldCheck,
  Building2,
  Network,
  Ban,
  Store,
  ClipboardList,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { Markdown } from "@/components/Markdown";

const TOPICS = [
  { title: "Procedimientos de selección", icon: ClipboardList },
  { title: "Montos tope y umbrales", icon: Scale },
  { title: "Penalidades y sanciones", icon: AlertTriangle },
  { title: "Registro de proveedores", icon: Users },
  { title: "Arbitraje y solución de controversias", icon: Gavel },
  { title: "Contratos y modificaciones", icon: FilePenLine },
  { title: "Garantías", icon: ShieldCheck },
  { title: "OECE y supervisión", icon: Building2 },
  { title: "SEACE / PLADICOP", icon: Network },
  { title: "Contrataciones excluidas", icon: Ban },
  { title: "Pequeñas y medianas empresas", icon: Store },
  { title: "Infracciones y responsabilidades", icon: FileText },
];

const CACHE_KEY = "lex32069_summaries";

function loadCache(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function Resumenes() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function openTopic(t: string) {
    setTopic(t);
    setOpen(true);
    setContent("");

    const cache = loadCache();
    if (cache[t]) {
      setContent(cache[t]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error generando el resumen.");
      setContent(data.summary);
      const next = { ...loadCache(), [t]: data.summary };
      localStorage.setItem(CACHE_KEY, JSON.stringify(next));
    } catch (err: any) {
      setContent(`⚠️ ${err.message || "Ocurrió un error."}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-100">Resúmenes por tema</h1>
        <p className="mt-1 text-sm text-slate-400">
          Genera resúmenes estructurados de los temas clave de la Ley 32069 y su
          Reglamento.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map(({ title, icon: Icon }) => (
          <button
            key={title}
            onClick={() => openTopic(title)}
            className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent-blue hover:shadow-lg hover:shadow-blue-500/5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue transition-colors group-hover:bg-accent-blue group-hover:text-white">
              <Icon size={20} />
            </span>
            <span className="pt-1 text-sm font-medium text-slate-200">
              {title}
            </span>
          </button>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={topic}>
        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-11/12" />
            <div className="skeleton h-3 w-4/5" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-3/4" />
          </div>
        ) : (
          <Markdown>{content}</Markdown>
        )}
      </Modal>
    </div>
  );
}
