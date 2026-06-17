"use client";

import { useEffect, useState } from "react";
import { Menu, BookA, HelpCircle } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { SECTIONS, type Section } from "@/lib/sections";
import { Chatbot } from "@/components/tabs/Chatbot";
import { Aprender } from "@/components/tabs/Aprender";
import { Indice } from "@/components/tabs/Indice";
import { Resumenes } from "@/components/tabs/Resumenes";
import { Buscador } from "@/components/tabs/Buscador";
import { Flashcards } from "@/components/tabs/Flashcards";
import { Quiz } from "@/components/tabs/Quiz";
import { Glosario } from "@/components/Glosario";
import { OnboardingTour } from "@/components/OnboardingTour";

const TOUR_KEY = "lex32069_tour_done";

export default function Home() {
  const [section, setSection] = useState<Section>("aprender");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [glosarioOpen, setGlosarioOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) setTourOpen(true);
  }, []);

  function openInChat(query: string) {
    setPendingQuery(query);
    setSection("chat");
  }

  function closeTour() {
    localStorage.setItem(TOUR_KEY, "1");
    setTourOpen(false);
  }

  const current = SECTIONS.find((s) => s.id === section)!;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        active={section}
        onChange={setSection}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-slate-300 hover:bg-slate-800 md:hidden"
            aria-label="Menú"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-slate-100">
              {current.label}
            </h1>
            <p className="hidden truncate text-xs text-slate-500 sm:block">
              {current.desc}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setGlosarioOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-accent-blue"
            >
              <BookA size={15} /> <span className="hidden sm:inline">Glosario</span>
            </button>
            <button
              onClick={() => setTourOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-accent-blue"
            >
              <HelpCircle size={15} /> <span className="hidden sm:inline">Ayuda</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          <div className={section === "chat" ? "h-full" : "hidden"}>
            <Chatbot
              pendingQuery={pendingQuery}
              onConsumeQuery={() => setPendingQuery(null)}
            />
          </div>

          {section === "aprender" && (
            <div className="h-full overflow-y-auto">
              <Aprender onOpenInChat={openInChat} />
            </div>
          )}
          {section === "indice" && (
            <div className="h-full overflow-hidden">
              <Indice onOpenInChat={openInChat} />
            </div>
          )}
          {section === "resumenes" && (
            <div className="h-full overflow-y-auto">
              <Resumenes />
            </div>
          )}
          {section === "buscador" && (
            <div className="h-full overflow-y-auto">
              <Buscador onOpenInChat={openInChat} />
            </div>
          )}
          {section === "flashcards" && (
            <div className="h-full overflow-y-auto">
              <Flashcards />
            </div>
          )}
          {section === "quiz" && (
            <div className="h-full overflow-y-auto">
              <Quiz />
            </div>
          )}
        </main>
      </div>

      <Glosario open={glosarioOpen} onClose={() => setGlosarioOpen(false)} />
      {tourOpen && <OnboardingTour onClose={closeTour} onGo={setSection} />}
    </div>
  );
}
