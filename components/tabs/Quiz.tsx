"use client";

import { useEffect, useState } from "react";
import { Brain, Check, X, RefreshCw, BarChart3, Trophy, Flame } from "lucide-react";
import { Modal } from "@/components/Modal";
import { cn } from "@/lib/utils";

type Quiz = {
  pregunta: string;
  opciones: { A: string; B: string; C: string; D: string };
  correcta: "A" | "B" | "C" | "D";
  explicacion: string;
  articulo: string;
};

type Stats = {
  total: number;
  correctas: number;
  incorrectas: number;
  streak: number;
};

const STATS_KEY = "lex32069_quiz_stats";
const DEFAULT_STATS: Stats = {
  total: 0,
  correctas: 0,
  incorrectas: 0,
  streak: 0,
};

function loadStats(): Stats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    return { ...DEFAULT_STATS, ...JSON.parse(localStorage.getItem(STATS_KEY) || "{}") };
  } catch {
    return DEFAULT_STATS;
  }
}

const LETTERS: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];

export function Quiz() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [statsOpen, setStatsOpen] = useState(false);

  useEffect(() => {
    setStats(loadStats());
  }, []);

  async function generate() {
    setLoading(true);
    setError("");
    setQuiz(null);
    setSelected(null);
    try {
      const res = await fetch("/api/quiz", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error generando la pregunta.");
      setQuiz(data);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  }

  function answer(opt: "A" | "B" | "C" | "D") {
    if (selected || !quiz) return;
    setSelected(opt);

    const correct = opt === quiz.correcta;
    const next: Stats = {
      total: stats.total + 1,
      correctas: stats.correctas + (correct ? 1 : 0),
      incorrectas: stats.incorrectas + (correct ? 0 : 1),
      streak: correct ? stats.streak + 1 : 0,
    };
    setStats(next);
    localStorage.setItem(STATS_KEY, JSON.stringify(next));
  }

  const accuracy =
    stats.total > 0 ? Math.round((stats.correctas / stats.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Quiz</h1>
          <p className="mt-1 text-sm text-slate-400">
            Pon a prueba tus conocimientos sobre la Ley 32069 y su Reglamento.
          </p>
        </div>
        <button
          onClick={() => setStatsOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-accent-blue"
        >
          <BarChart3 size={15} /> Mis estadísticas
        </button>
      </div>

      {/* Mini stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatChip label="Respondidas" value={stats.total} />
        <StatChip label="Aciertos" value={`${accuracy}%`} accent="green" />
        <StatChip
          label="Racha"
          value={stats.streak}
          accent="blue"
          icon={<Flame size={14} />}
        />
      </div>

      {!quiz && !loading && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Brain className="mx-auto mb-4 text-accent-blue" size={40} />
          <p className="mb-5 text-sm text-slate-400">
            Genera una pregunta de opción múltiple basada en un artículo al azar.
          </p>
          <button
            onClick={generate}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            <Brain size={16} /> Generar pregunta
          </button>
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="skeleton mb-4 h-5 w-3/4" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-11 w-full" />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          ⚠️ {error}
          <button
            onClick={generate}
            className="ml-2 underline hover:text-red-200"
          >
            Reintentar
          </button>
        </div>
      )}

      {quiz && (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="mb-5 text-base font-medium leading-relaxed text-slate-100">
            {quiz.pregunta}
          </p>

          <div className="space-y-2.5">
            {LETTERS.map((letter) => {
              const isCorrect = letter === quiz.correcta;
              const isSelected = letter === selected;
              const showState = selected !== null;

              return (
                <button
                  key={letter}
                  onClick={() => answer(letter)}
                  disabled={selected !== null}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                    !showState &&
                      "border-border bg-background hover:border-accent-blue hover:bg-slate-800",
                    showState &&
                      isCorrect &&
                      "border-accent-green bg-accent-green/15 text-green-200",
                    showState &&
                      isSelected &&
                      !isCorrect &&
                      "border-red-500 bg-red-500/15 text-red-200",
                    showState &&
                      !isCorrect &&
                      !isSelected &&
                      "border-border bg-background opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                      !showState && "bg-slate-700 text-slate-300",
                      showState && isCorrect && "bg-accent-green text-white",
                      showState &&
                        isSelected &&
                        !isCorrect &&
                        "bg-red-500 text-white",
                      showState &&
                        !isCorrect &&
                        !isSelected &&
                        "bg-slate-700 text-slate-400"
                    )}
                  >
                    {showState && isCorrect ? (
                      <Check size={14} />
                    ) : showState && isSelected && !isCorrect ? (
                      <X size={14} />
                    ) : (
                      letter
                    )}
                  </span>
                  <span className="flex-1">{quiz.opciones[letter]}</span>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="mt-5 animate-fade-in space-y-3">
              <div
                className={cn(
                  "rounded-lg p-4 text-sm",
                  selected === quiz.correcta
                    ? "bg-accent-green/10 text-green-200"
                    : "bg-red-500/10 text-red-200"
                )}
              >
                <p className="mb-1 font-semibold">
                  {selected === quiz.correcta
                    ? "✅ ¡Correcto!"
                    : `❌ Incorrecto — la respuesta es ${quiz.correcta}.`}
                </p>
                <p className="text-slate-300">{quiz.explicacion}</p>
                <p className="mt-2 text-xs text-slate-400">
                  📖 {quiz.articulo}
                </p>
              </div>
              <button
                onClick={generate}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent-blue px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
              >
                <RefreshCw size={16} /> Siguiente pregunta
              </button>
            </div>
          )}
        </div>
      )}

      <Modal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        title="Mis estadísticas"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <BigStat
              label="Total respondidas"
              value={stats.total}
              icon={<Brain size={18} />}
            />
            <BigStat
              label="% de acierto"
              value={`${accuracy}%`}
              icon={<Trophy size={18} />}
              accent="green"
            />
            <BigStat
              label="Correctas"
              value={stats.correctas}
              accent="green"
            />
            <BigStat label="Incorrectas" value={stats.incorrectas} accent="red" />
            <BigStat
              label="Racha actual"
              value={stats.streak}
              icon={<Flame size={18} />}
              accent="blue"
            />
          </div>
          <button
            onClick={() => {
              setStats(DEFAULT_STATS);
              localStorage.setItem(STATS_KEY, JSON.stringify(DEFAULT_STATS));
            }}
            className="w-full rounded-lg border border-border px-4 py-2 text-sm text-slate-400 transition-colors hover:border-red-500/50 hover:text-red-300"
          >
            Reiniciar estadísticas
          </button>
        </div>
      </Modal>
    </div>
  );
}

function StatChip({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  accent?: "green" | "blue";
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-center">
      <div
        className={cn(
          "flex items-center justify-center gap-1 text-lg font-bold",
          accent === "green" && "text-accent-green",
          accent === "blue" && "text-accent-blue",
          !accent && "text-slate-100"
        )}
      >
        {icon}
        {value}
      </div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

function BigStat({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  accent?: "green" | "blue" | "red";
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div
        className={cn(
          "flex items-center gap-2 text-2xl font-bold",
          accent === "green" && "text-accent-green",
          accent === "blue" && "text-accent-blue",
          accent === "red" && "text-red-400",
          !accent && "text-slate-100"
        )}
      >
        {icon}
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}
