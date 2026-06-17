"use client";

import { useEffect, useMemo, useState } from "react";
import { Layers, RotateCcw, ArrowLeft, Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Card = { frente: string; reverso: string; articulo?: string };
type SRS = { ease: number; interval: number; due: number; reps: number };
type Deck = { topic: string; cards: Card[]; srs: SRS[] };

const DECKS_KEY = "lex32069_decks";
const DAY = 24 * 60 * 60 * 1000;

const TOPICS = [
  "Siglas y definiciones clave",
  "Procedimientos de selección",
  "Garantías",
  "Penalidades y sanciones",
  "Solución de controversias",
  "Registro de proveedores",
  "Contratos y modificaciones",
  "Montos y umbrales",
];

const loadDecks = (): Record<string, Deck> => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(DECKS_KEY) || "{}");
  } catch {
    return {};
  }
};
const saveDecks = (d: Record<string, Deck>) =>
  localStorage.setItem(DECKS_KEY, JSON.stringify(d));

const freshSRS = (): SRS => ({ ease: 2.3, interval: 0, due: Date.now(), reps: 0 });

function schedule(srs: SRS, quality: "again" | "hard" | "good" | "easy"): SRS {
  let { ease, interval, reps } = srs;
  if (quality === "again") {
    reps = 0;
    interval = 0; // se repite en esta misma sesión
    ease = Math.max(1.3, ease - 0.2);
  } else {
    const delta = quality === "hard" ? -0.15 : quality === "easy" ? 0.15 : 0;
    ease = Math.max(1.3, ease + delta);
    if (reps === 0) interval = quality === "easy" ? 2 : 1;
    else if (reps === 1) interval = quality === "hard" ? 2 : 4;
    else interval = Math.round(interval * ease * (quality === "hard" ? 0.7 : quality === "easy" ? 1.3 : 1));
    reps += 1;
  }
  return { ease, interval, reps, due: Date.now() + interval * DAY };
}

export function Flashcards() {
  const [decks, setDecks] = useState<Record<string, Deck>>({});
  const [topic, setTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [queue, setQueue] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => setDecks(loadDecks()), []);

  const deck = topic ? decks[topic] : null;

  const dueCount = (t: string) => {
    const d = decks[t];
    if (!d) return 0;
    return d.srs.filter((s) => s.due <= Date.now()).length;
  };

  async function startTopic(t: string) {
    setTopic(t);
    setError("");
    setFlipped(false);
    setPos(0);

    let d = loadDecks()[t];
    if (!d) {
      setLoading(true);
      try {
        const res = await fetch("/api/flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: t }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Error generando tarjetas.");
        const cards: Card[] = json.cards || [];
        if (cards.length === 0) throw new Error("No se generaron tarjetas.");
        d = { topic: t, cards, srs: cards.map(() => freshSRS()) };
        const next = { ...loadDecks(), [t]: d };
        saveDecks(next);
        setDecks(next);
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    // Cola: primero las vencidas; si no hay, todas.
    const due = d.srs
      .map((s, i) => ({ s, i }))
      .filter((x) => x.s.due <= Date.now())
      .map((x) => x.i);
    setQueue(due.length ? due : d.cards.map((_, i) => i));
  }

  function rate(quality: "again" | "hard" | "good" | "easy") {
    if (!deck || !topic) return;
    const cardIdx = queue[pos];
    const newSrs = schedule(deck.srs[cardIdx], quality);
    const updatedDeck: Deck = {
      ...deck,
      srs: deck.srs.map((s, i) => (i === cardIdx ? newSrs : s)),
    };
    const next = { ...decks, [topic]: updatedDeck };
    setDecks(next);
    saveDecks(next);

    let newQueue = queue;
    if (quality === "again") newQueue = [...queue, cardIdx]; // reaparece al final
    setQueue(newQueue);
    setFlipped(false);
    setPos((p) => p + 1);
  }

  function regenerate() {
    if (!topic) return;
    const next = { ...loadDecks() };
    delete next[topic];
    saveDecks(next);
    setDecks(next);
    startTopic(topic);
  }

  // Vista: selección de tema
  if (!topic) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex items-center gap-2 text-accent-blue">
          <Layers size={20} />
          <h1 className="text-lg font-bold text-slate-100">Flashcards</h1>
        </div>
        <p className="mb-6 text-sm text-slate-400">
          Memoriza con repaso espaciado: las tarjetas que fallas vuelven antes.
          Elige un tema para empezar.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((t) => {
            const exists = !!decks[t];
            const due = dueCount(t);
            return (
              <button
                key={t}
                onClick={() => startTopic(t)}
                className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent-blue"
              >
                <Layers
                  size={20}
                  className="text-accent-blue transition-transform group-hover:scale-110"
                />
                <span className="text-sm font-medium text-slate-200">{t}</span>
                {exists ? (
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    {due > 0 ? (
                      <>
                        <Clock size={11} className="text-accent-green" />
                        <span className="text-accent-green">{due} para repasar</span>
                      </>
                    ) : (
                      "Al día ✓"
                    )}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-600">Generar mazo</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Vista: cargando
  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="skeleton mb-4 h-5 w-40" />
        <div className="skeleton h-64 w-full rounded-2xl" />
      </div>
    );
  }

  // Vista: error
  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 text-center">
        <p className="mb-4 text-sm text-red-300">⚠️ {error}</p>
        <button
          onClick={() => setTopic(null)}
          className="rounded-lg border border-border px-4 py-2 text-sm text-slate-300 hover:border-accent-blue"
        >
          Volver
        </button>
      </div>
    );
  }

  const finished = pos >= queue.length;
  const card = !finished && deck ? deck.cards[queue[pos]] : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setTopic(null)}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft size={14} /> Temas
        </button>
        <span className="text-xs text-slate-500">{topic}</span>
        <button
          onClick={regenerate}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
          title="Generar mazo nuevo"
        >
          <Sparkles size={13} /> Nuevo mazo
        </button>
      </div>

      {!finished && card && (
        <>
          <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              Tarjeta {pos + 1} de {queue.length}
            </span>
          </div>

          <button
            onClick={() => setFlipped((f) => !f)}
            className="flex min-h-[260px] w-full flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 text-center transition-colors hover:border-slate-500"
          >
            {!flipped ? (
              <>
                <span className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">
                  Pregunta
                </span>
                <p className="text-lg font-medium text-slate-100">{card.frente}</p>
                <span className="mt-4 text-xs text-slate-600">
                  Toca para ver la respuesta
                </span>
              </>
            ) : (
              <>
                <span className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">
                  Respuesta
                </span>
                <p className="text-base text-slate-200">{card.reverso}</p>
                {card.articulo && (
                  <span className="mt-3 rounded-md bg-accent-blue/15 px-2 py-1 text-xs text-accent-blue">
                    {card.articulo}
                  </span>
                )}
              </>
            )}
          </button>

          {flipped ? (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {([
                ["again", "Otra vez", "bg-red-500/80 hover:bg-red-500"],
                ["hard", "Difícil", "bg-amber-500/80 hover:bg-amber-500"],
                ["good", "Bien", "bg-accent-blue hover:bg-blue-600"],
                ["easy", "Fácil", "bg-accent-green hover:bg-green-600"],
              ] as const).map(([q, label, color]) => (
                <button
                  key={q}
                  onClick={() => rate(q)}
                  className={cn(
                    "rounded-lg px-2 py-2.5 text-xs font-medium text-white transition-colors",
                    color
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-center text-xs text-slate-600">
              Piensa la respuesta y luego voltea la tarjeta.
            </p>
          )}
        </>
      )}

      {finished && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mb-3 text-4xl">🎉</div>
          <h2 className="text-lg font-semibold text-slate-100">
            ¡Terminaste este repaso!
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Las tarjetas reaparecerán según tu desempeño (repaso espaciado).
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              onClick={() => startTopic(topic)}
              className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              <RotateCcw size={15} /> Repasar de nuevo
            </button>
            <button
              onClick={() => setTopic(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-slate-300 hover:border-accent-blue"
            >
              Otros temas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
