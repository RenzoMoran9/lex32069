"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Circle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Sparkles,
  X as XIcon,
} from "lucide-react";
import { CURRICULUM, ALL_LESSONS, TOTAL_LESSONS, type Lesson } from "@/lib/curriculum";
import { Markdown } from "@/components/Markdown";
import { cn } from "@/lib/utils";

type QuizItem = {
  pregunta: string;
  opciones: { A: string; B: string; C: string; D: string };
  correcta: "A" | "B" | "C" | "D";
  explicacion: string;
};
type LessonData = {
  id: string;
  title: string;
  introduccion: string;
  puntosClave: string[];
  articulos: string[];
  quiz: QuizItem[];
};

const DONE_KEY = "lex32069_lessons_done";
const CACHE_KEY = "lex32069_lesson_cache";

const loadDone = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DONE_KEY) || "[]");
  } catch {
    return [];
  }
};
const loadCache = (): Record<string, LessonData> => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
};

export function Aprender({
  onOpenInChat,
}: {
  onOpenInChat: (q: string) => void;
}) {
  const [done, setDone] = useState<string[]>([]);
  const [active, setActive] = useState<Lesson | null>(null);
  const [data, setData] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setDone(loadDone()), []);

  const completed = done.length;
  const pct = Math.round((completed / TOTAL_LESSONS) * 100);
  const nextLesson = ALL_LESSONS.find((l) => !done.includes(l.id));

  async function openLesson(lesson: Lesson) {
    setActive(lesson);
    setError("");
    const cache = loadCache();
    if (cache[lesson.id]) {
      setData(cache[lesson.id]);
      return;
    }
    setData(null);
    setLoading(true);
    try {
      const res = await fetch("/api/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error generando la lección.");
      setData(json);
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ...loadCache(), [lesson.id]: json })
      );
    } catch (err: any) {
      setError(err.message || "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  }

  function markDone(id: string) {
    if (done.includes(id)) return;
    const next = [...done, id];
    setDone(next);
    localStorage.setItem(DONE_KEY, JSON.stringify(next));
  }

  function close() {
    setActive(null);
    setData(null);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Encabezado con progreso */}
      <div className="mb-6 rounded-2xl border border-border bg-gradient-to-br from-card to-[#0b1220] p-5">
        <div className="flex items-center gap-2 text-accent-blue">
          <Sparkles size={18} />
          <h1 className="text-lg font-bold text-slate-100">Ruta de aprendizaje</h1>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Estudia la ley paso a paso, en orden. Cada lección tiene su explicación,
          puntos clave y un mini quiz.
        </p>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {completed} de {TOTAL_LESSONS} lecciones
            </span>
            <span className="font-semibold text-accent-green">{pct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-accent-green transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {nextLesson && (
          <button
            onClick={() => openLesson(nextLesson)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            {completed === 0 ? "Empezar" : "Continuar"}: {nextLesson.title}
            <ArrowRight size={15} />
          </button>
        )}
        {!nextLesson && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent-green/15 px-4 py-2 text-sm font-medium text-accent-green">
            <CheckCircle2 size={16} /> ¡Completaste toda la ruta! 🎉
          </p>
        )}
      </div>

      {/* Módulos y lecciones */}
      <div className="space-y-6">
        {CURRICULUM.map((mod) => (
          <div key={mod.id}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {mod.title}
            </h2>
            <div className="space-y-2">
              {mod.lessons.map((lesson) => {
                const isDone = done.includes(lesson.id);
                return (
                  <button
                    key={lesson.id}
                    onClick={() => openLesson(lesson)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-all hover:border-accent-blue"
                  >
                    {isDone ? (
                      <CheckCircle2 size={20} className="shrink-0 text-accent-green" />
                    ) : (
                      <Circle size={20} className="shrink-0 text-slate-600" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-200">
                        {lesson.title}
                      </div>
                      <div className="truncate text-xs text-slate-500">
                        {lesson.summary}
                      </div>
                    </div>
                    <ArrowRight
                      size={16}
                      className="shrink-0 text-slate-600 transition-colors group-hover:text-accent-blue"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Panel de lección */}
      {active && (
        <LessonPanel
          lesson={active}
          data={data}
          loading={loading}
          error={error}
          done={done.includes(active.id)}
          onClose={close}
          onMarkDone={() => markDone(active.id)}
          onOpenInChat={onOpenInChat}
          onRetry={() => openLesson(active)}
        />
      )}
    </div>
  );
}

function LessonPanel({
  lesson,
  data,
  loading,
  error,
  done,
  onClose,
  onMarkDone,
  onOpenInChat,
  onRetry,
}: {
  lesson: Lesson;
  data: LessonData | null;
  loading: boolean;
  error: string;
  done: boolean;
  onClose: () => void;
  onMarkDone: () => void;
  onOpenInChat: (q: string) => void;
  onRetry: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full flex-col border-l border-border bg-card shadow-2xl sm:max-w-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2 text-slate-100">
            <BookOpen size={18} className="text-accent-blue" />
            <h2 className="text-base font-semibold">{lesson.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading && (
            <div className="space-y-3">
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-11/12" />
              <div className="skeleton h-4 w-4/5" />
              <div className="skeleton mt-4 h-5 w-1/3" />
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full" />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              ⚠️ {error}{" "}
              <button onClick={onRetry} className="underline hover:text-red-200">
                Reintentar
              </button>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              <Markdown>{data.introduccion}</Markdown>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-100">
                  Puntos clave
                </h3>
                <ul className="space-y-1.5">
                  {data.puntosClave?.map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <Check size={16} className="mt-0.5 shrink-0 text-accent-green" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {data.articulos?.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-100">
                    Artículos de referencia
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.articulos.map((a, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-accent-blue/15 px-2 py-1 text-xs text-accent-blue"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {data.quiz?.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-100">
                    Mini quiz
                  </h3>
                  <div className="space-y-4">
                    {data.quiz.map((q, i) => (
                      <MiniQuiz key={i} item={q} index={i} />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
                <button
                  onClick={onMarkDone}
                  disabled={done}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                    done
                      ? "cursor-default bg-accent-green/15 text-accent-green"
                      : "bg-accent-green text-white hover:bg-green-600"
                  )}
                >
                  {done ? (
                    <>
                      <CheckCircle2 size={16} /> Lección completada
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Marcar como completada
                    </>
                  )}
                </button>
                <button
                  onClick={() =>
                    onOpenInChat(`Explícame más a fondo sobre: ${lesson.topic}`)
                  }
                  className="rounded-lg border border-border px-4 py-2.5 text-sm text-slate-300 transition-colors hover:border-accent-blue"
                >
                  Profundizar en el chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniQuiz({ item, index }: { item: QuizItem; index: number }) {
  const [sel, setSel] = useState<"A" | "B" | "C" | "D" | null>(null);
  const letters: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="mb-3 text-sm font-medium text-slate-200">
        {index + 1}. {item.pregunta}
      </p>
      <div className="space-y-2">
        {letters.map((l) => {
          const show = sel !== null;
          const correct = l === item.correcta;
          const picked = l === sel;
          return (
            <button
              key={l}
              onClick={() => !sel && setSel(l)}
              disabled={sel !== null}
              className={cn(
                "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                !show && "border-border hover:border-accent-blue",
                show && correct && "border-accent-green bg-accent-green/15 text-green-200",
                show && picked && !correct && "border-red-500 bg-red-500/15 text-red-200",
                show && !correct && !picked && "border-border opacity-60"
              )}
            >
              <span className="font-bold">{l}.</span> {item.opciones[l]}
            </button>
          );
        })}
      </div>
      {sel && (
        <p
          className={cn(
            "mt-3 rounded-md p-3 text-xs",
            sel === item.correcta
              ? "bg-accent-green/10 text-green-200"
              : "bg-red-500/10 text-red-200"
          )}
        >
          {sel === item.correcta ? "✅ Correcto. " : `❌ La respuesta es ${item.correcta}. `}
          {item.explicacion}
        </p>
      )}
    </div>
  );
}
