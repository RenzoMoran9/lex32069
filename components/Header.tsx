"use client";

import { MessageSquare, BookText, Search, Brain, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tab = "chat" | "resumenes" | "buscador" | "quiz";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "chat", label: "Chatbot", icon: MessageSquare },
  { id: "resumenes", label: "Resúmenes", icon: BookText },
  { id: "buscador", label: "Buscador", icon: Search },
  { id: "quiz", label: "Quiz", icon: Brain },
];

export function Header({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <header className="z-30 shrink-0 border-b border-border bg-background">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue text-white">
            <Scale size={18} />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-100">
            LEX<span className="text-accent-blue">32069</span>
          </span>
        </div>
        <span className="hidden rounded-full border border-border bg-card px-3 py-1 text-xs text-slate-400 sm:inline">
          Ley 32069 + Reglamento
        </span>

        <nav className="ml-auto flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                active === id
                  ? "bg-accent-blue text-white"
                  : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              )}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
