"use client";

import { Scale, X } from "lucide-react";
import { SECTIONS, type Section } from "@/lib/sections";

export function OnboardingTour({
  onClose,
  onGo,
}: {
  onClose: () => void;
  onGo: (s: Section) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-blue text-white">
            <Scale size={22} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Bienvenido a LEX<span className="text-accent-blue">32069</span>
            </h2>
            <p className="text-xs text-slate-400">
              Tu asistente para dominar la Ley 32069 y su Reglamento.
            </p>
          </div>
        </div>

        <p className="mb-3 text-sm text-slate-300">
          Tienes 7 herramientas. Si quieres estudiar <strong>en orden</strong>,
          empieza por <strong>Aprender</strong>:
        </p>

        <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SECTIONS.map(({ id, label, icon: Icon, desc }) => (
            <div
              key={id}
              className="flex items-start gap-2.5 rounded-lg border border-border bg-background p-2.5"
            >
              <Icon size={16} className="mt-0.5 shrink-0 text-accent-blue" />
              <div className="leading-tight">
                <div className="text-xs font-semibold text-slate-200">{label}</div>
                <div className="text-[11px] text-slate-500">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              onGo("aprender");
              onClose();
            }}
            className="flex-1 rounded-lg bg-accent-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
          >
            Empezar a aprender
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-700"
          >
            Explorar solo
          </button>
        </div>
      </div>
    </div>
  );
}
