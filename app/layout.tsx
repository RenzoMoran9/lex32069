import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LEX32069 — Asistente de Contrataciones Públicas",
  description:
    "Asistente personal para estudiar y consultar la Ley General de Contrataciones Públicas del Perú (Ley 32069) y su Reglamento (DS 009-2025-EF).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body>{children}</body>
    </html>
  );
}
