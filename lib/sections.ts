import {
  GraduationCap,
  MessageSquare,
  BookText,
  ListTree,
  Search,
  Layers,
  Brain,
  type LucideIcon,
} from "lucide-react";

export type Section =
  | "aprender"
  | "chat"
  | "indice"
  | "resumenes"
  | "buscador"
  | "flashcards"
  | "quiz";

export const SECTIONS: {
  id: Section;
  label: string;
  icon: LucideIcon;
  desc: string;
}[] = [
  { id: "aprender", label: "Aprender", icon: GraduationCap, desc: "Ruta de estudio paso a paso" },
  { id: "chat", label: "Chat", icon: MessageSquare, desc: "Pregunta lo que quieras" },
  { id: "indice", label: "Índice", icon: ListTree, desc: "Navega la ley por artículos" },
  { id: "resumenes", label: "Resúmenes", icon: BookText, desc: "Resúmenes por tema" },
  { id: "buscador", label: "Buscador", icon: Search, desc: "Encuentra artículos" },
  { id: "flashcards", label: "Flashcards", icon: Layers, desc: "Memoriza con repaso" },
  { id: "quiz", label: "Quiz", icon: Brain, desc: "Pon a prueba tu conocimiento" },
];
