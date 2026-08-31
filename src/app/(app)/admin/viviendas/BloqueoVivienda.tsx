"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bloquearVivienda, desbloquearVivienda } from "../actions";
import { Alert } from "@/components/ui";

export default function BloqueoVivienda({
  id,
  bloqueada,
  motivo,
}: {
  id: string;
  bloqueada: boolean;
  motivo: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");

  if (bloqueada) {
    return (
      <div className="flex flex-col items-end gap-1">
        {error ? <Alert>{error}</Alert> : null}
        <span className="text-xs text-danger">{motivo || "Bloqueada"}</span>
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await desbloquearVivienda(id);
              if (r.error) setError(r.error);
              else router.refresh();
            })
          }
          className="h-8 rounded-lg bg-accent px-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "…" : "Desbloquear"}
        </button>
      </div>
    );
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="h-8 rounded-lg border border-danger/40 bg-surface px-3 text-sm font-semibold text-danger"
      >
        Bloquear
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col items-end gap-1.5">
      {error ? <Alert>{error}</Alert> : null}
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Motivo (impago de cuota…)"
        className="h-9 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm"
      />
      <div className="flex gap-2">
        <button onClick={() => setAbierto(false)} className="h-8 rounded-lg border border-line-strong bg-surface px-3 text-sm font-semibold">
          Cancelar
        </button>
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await bloquearVivienda(id, texto);
              if (r.error) setError(r.error);
              else router.refresh();
            })
          }
          className="h-8 rounded-lg bg-danger px-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "…" : "Bloquear"}
        </button>
      </div>
    </div>
  );
}
