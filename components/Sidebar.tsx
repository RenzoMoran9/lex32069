"use client";

import { Scale } from "lucide-react";
import { SECTIONS, type Section } from "@/lib/sections";
import { cn } from "@/lib/utils";

function NavList({
  active,
  onChange,
}: {
  active: Section;
  onChange: (s: Section) => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-2">
      {SECTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            active === id
              ? "bg-accent-blue text-white shadow-sm shadow-blue-500/20"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          )}
        >
          <Icon size={18} className="shrink-0" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue text-white">
        <Scale size={20} />
      </span>
      <div className="leading-tight">
        <div className="text-base font-extrabold tracking-tight text-slate-100">
          LEX<span className="text-accent-blue">32069</span>
        </div>
        <div className="text-[10px] text-slate-500">Ley 32069 + Reglamento</div>
      </div>
    </div>
  );
}

export function Sidebar({
  active,
  onChange,
  mobileOpen,
  onCloseMobile,
}: {
  active: Section;
  onChange: (s: Section) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const handleChange = (s: Section) => {
    onChange(s);
    onCloseMobile();
  };

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-border bg-[#0b1220] md:flex">
        <Brand />
        <NavList active={active} onChange={onChange} />
        <div className="px-4 py-4 text-[10px] leading-relaxed text-slate-600">
          Asistente de estudio con IA. Verifica siempre los artículos citados.
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        >
          <aside
            className="flex h-full w-[240px] flex-col border-r border-border bg-[#0b1220] animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <Brand />
            <NavList active={active} onChange={handleChange} />
          </aside>
        </div>
      )}
    </>
  );
}
