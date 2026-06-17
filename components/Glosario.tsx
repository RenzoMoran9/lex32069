"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";

const TERMS: { sigla: string; nombre: string; def: string }[] = [
  {
    sigla: "OECE",
    nombre: "Organismo Especializado para las Contrataciones Públicas Eficientes",
    def: "Organismo técnico especializado adscrito al MEF que rige, supervisa y da soporte al sistema de contratación pública. Reemplaza al antiguo OSCE.",
  },
  {
    sigla: "SEACE",
    nombre: "Sistema Electrónico de Contrataciones del Estado",
    def: "Plataforma electrónica donde se publican y gestionan los procedimientos de contratación pública.",
  },
  {
    sigla: "PLADICOP",
    nombre: "Plataforma Digital para las Contrataciones Públicas",
    def: "Plataforma digital integrada que soporta todo el ciclo de la contratación pública bajo la nueva ley.",
  },
  {
    sigla: "RNP",
    nombre: "Registro Nacional de Proveedores",
    def: "Registro donde deben inscribirse los proveedores para poder contratar con el Estado.",
  },
  {
    sigla: "DGA",
    nombre: "Dirección General de Abastecimiento",
    def: "Órgano del MEF rector del Sistema Nacional de Abastecimiento.",
  },
  {
    sigla: "TCP",
    nombre: "Tribunal de Contrataciones Públicas",
    def: "Órgano resolutivo que resuelve controversias e impone sanciones a proveedores.",
  },
  {
    sigla: "JPRD",
    nombre: "Junta de Prevención y Resolución de Disputas",
    def: "Mecanismo para prevenir y resolver disputas durante la ejecución de contratos, especialmente de obra.",
  },
  {
    sigla: "REGAJU",
    nombre: "Registro de Árbitros y Centros de Arbitraje",
    def: "Registro de instituciones arbitrales y centros que administran controversias.",
  },
  {
    sigla: "EETT / TDR",
    nombre: "Especificaciones Técnicas / Términos de Referencia",
    def: "Documentos que definen las características de los bienes (EETT) o servicios (TDR) a contratar.",
  },
  {
    sigla: "UIT",
    nombre: "Unidad Impositiva Tributaria",
    def: "Valor de referencia usado para fijar los montos y umbrales de los procedimientos de selección.",
  },
];

export function Glosario({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const filtered = TERMS.filter(
    (t) =>
      t.sigla.toLowerCase().includes(q.toLowerCase()) ||
      t.nombre.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Modal open={open} onClose={onClose} title="Glosario de siglas">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar sigla o término..."
        className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent-blue"
      />
      <div className="space-y-3">
        {filtered.map((t) => (
          <div
            key={t.sigla}
            className="rounded-lg border border-border bg-background p-3"
          >
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-accent-blue">{t.sigla}</span>
              <span className="text-xs text-slate-400">{t.nombre}</span>
            </div>
            <p className="mt-1 text-sm text-slate-300">{t.def}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">
            No se encontró ese término.
          </p>
        )}
      </div>
    </Modal>
  );
}
