"use client";

import { useState } from "react";
import { Header, type Tab } from "@/components/Header";
import { Chatbot } from "@/components/tabs/Chatbot";
import { Resumenes } from "@/components/tabs/Resumenes";
import { Buscador } from "@/components/tabs/Buscador";
import { Quiz } from "@/components/tabs/Quiz";

export default function Home() {
  const [tab, setTab] = useState<Tab>("chat");
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);

  function openInChat(query: string) {
    setPendingQuery(query);
    setTab("chat");
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header active={tab} onChange={setTab} />

      <main className="flex-1 overflow-hidden">
        {/* Mantenemos el Chatbot montado para no perder el estado al cambiar de tab */}
        <div className={tab === "chat" ? "h-full" : "hidden"}>
          <Chatbot
            pendingQuery={pendingQuery}
            onConsumeQuery={() => setPendingQuery(null)}
          />
        </div>

        {tab === "resumenes" && (
          <div className="h-full overflow-y-auto">
            <Resumenes />
          </div>
        )}

        {tab === "buscador" && (
          <div className="h-full overflow-y-auto">
            <Buscador onOpenInChat={openInChat} />
          </div>
        )}

        {tab === "quiz" && (
          <div className="h-full overflow-y-auto">
            <Quiz />
          </div>
        )}
      </main>
    </div>
  );
}
