"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, Plus, Send, Trash2, MessageSquare, Bot, User } from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };
type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
};

const STORAGE_KEY = "lex32069_conversations";

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveConversations(convos: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
}

export function Chatbot({
  pendingQuery,
  onConsumeQuery,
}: {
  pendingQuery?: string | null;
  onConsumeQuery?: () => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Carga inicial desde localStorage.
  useEffect(() => {
    const convos = loadConversations();
    setConversations(convos);
    if (convos.length > 0) setCurrentId(convos[0].id);
  }, []);

  const current = conversations.find((c) => c.id === currentId) || null;
  const messages = current?.messages || [];

  // Auto-scroll al fondo.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, streaming]);

  // Maneja consultas entrantes desde el Buscador ("Ver en contexto").
  useEffect(() => {
    if (pendingQuery) {
      void send(pendingQuery);
      onConsumeQuery?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuery]);

  function persist(next: Conversation[]) {
    setConversations(next);
    saveConversations(next);
  }

  function newConversation() {
    setCurrentId(null);
    setInput("");
    setDrawerOpen(false);
    textareaRef.current?.focus();
  }

  function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const next = conversations.filter((c) => c.id !== id);
    persist(next);
    if (currentId === id) setCurrentId(next[0]?.id || null);
  }

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;

    // Asegura una conversación activa.
    let convo = current;
    let convos = conversations;

    if (!convo) {
      convo = {
        id: crypto.randomUUID(),
        title: q.slice(0, 60),
        messages: [],
        createdAt: Date.now(),
      };
      convos = [convo, ...conversations];
      setCurrentId(convo.id);
    }

    const userMsg: Message = { role: "user", content: q };
    const history = convo.messages;
    const updatedMsgs = [...history, userMsg];

    convos = convos.map((c) =>
      c.id === convo!.id ? { ...c, messages: updatedMsgs } : c
    );
    persist(convos);
    setInput("");
    setLoading(true);
    setStreaming("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, question: q }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error en el servidor.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreaming(acc);
      }

      const assistantMsg: Message = { role: "assistant", content: acc };
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === convo!.id
            ? { ...c, messages: [...updatedMsgs, assistantMsg] }
            : c
        );
        saveConversations(next);
        return next;
      });
    } catch (err: any) {
      const assistantMsg: Message = {
        role: "assistant",
        content: `⚠️ ${err.message || "Ocurrió un error."}`,
      };
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === convo!.id
            ? { ...c, messages: [...updatedMsgs, assistantMsg] }
            : c
        );
        saveConversations(next);
        return next;
      });
    } finally {
      setLoading(false);
      setStreaming("");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  const Sidebar = (
    <div className="flex h-full w-[260px] flex-col border-r border-border bg-[#0b1220]">
      <div className="p-3">
        <button
          onClick={newConversation}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-blue px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
        >
          <Plus size={16} /> Nueva conversación
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-slate-500">
            Aún no hay conversaciones.
          </p>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setCurrentId(c.id);
              setDrawerOpen(false);
            }}
            className={cn(
              "group mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              c.id === currentId
                ? "bg-slate-700/60 text-slate-100"
                : "text-slate-300 hover:bg-slate-800"
            )}
          >
            <MessageSquare size={15} className="shrink-0 text-slate-500" />
            <span className="flex-1 truncate">{c.title}</span>
            <span
              onClick={(e) => deleteConversation(c.id, e)}
              className="shrink-0 rounded p-1 text-slate-500 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar fijo en desktop */}
      <div className="hidden md:flex">{Sidebar}</div>

      {/* Drawer móvil */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="h-full w-fit" onClick={(e) => e.stopPropagation()}>
            {Sidebar}
          </div>
        </div>
      )}

      {/* Área de chat */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2 md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-2 text-slate-300 hover:bg-slate-800"
          >
            <Menu size={18} />
          </button>
          <span className="text-sm text-slate-400">Conversaciones</span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6">
            {messages.length === 0 && !streaming && (
              <div className="mt-10 text-center">
                <Bot className="mx-auto mb-4 text-accent-blue" size={40} />
                <h2 className="text-xl font-semibold text-slate-100">
                  ¿En qué puedo ayudarte?
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Pregúntame sobre la Ley 32069 o su Reglamento. Citaré los
                  artículos exactos.
                </p>
                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {[
                    "¿Cuáles son los procedimientos de selección?",
                    "¿Qué garantías exige la ley?",
                    "¿Cómo funciona el arbitraje?",
                    "¿Cuáles son las penalidades por incumplimiento?",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => void send(s)}
                      className="rounded-lg border border-border bg-card px-4 py-3 text-left text-sm text-slate-300 transition-colors hover:border-accent-blue hover:bg-slate-800"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}

            {streaming && (
              <MessageBubble message={{ role: "assistant", content: streaming }} />
            )}

            {loading && !streaming && (
              <div className="flex gap-3 py-4">
                <Avatar role="assistant" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="skeleton h-3 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                  <div className="skeleton h-3 w-2/3" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border bg-background px-4 py-3">
          <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 focus-within:border-accent-blue">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Escribe tu pregunta... (Enter para enviar)"
                className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-blue text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[11px] text-slate-600">
              LEX32069 puede cometer errores. Verifica los artículos citados.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function Avatar({ role }: { role: "user" | "assistant" }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        role === "assistant"
          ? "bg-accent-blue/15 text-accent-blue"
          : "bg-accent-green/15 text-accent-green"
      )}
    >
      {role === "assistant" ? <Bot size={17} /> : <User size={17} />}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <div className="flex gap-3 py-4">
      <Avatar role={message.role} />
      <div className="min-w-0 flex-1 pt-0.5">
        {message.role === "assistant" ? (
          <Markdown>{message.content}</Markdown>
        ) : (
          <p className="whitespace-pre-wrap text-sm text-slate-100">
            {message.content}
          </p>
        )}
      </div>
    </div>
  );
}
