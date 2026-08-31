"use client";

import { useActionState } from "react";
import { crearMantenimientoAction } from "../actions";
import { Field, TextInput, Select, SubmitButton, Alert } from "@/components/ui";

type FS = { error?: string; ok?: boolean };
const initial: FS = {};
const INICIO = [10, 11, 12, 13, 14, 17, 18, 19, 20, 21, 22];
const FIN = [11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 23];

export default function MantenimientoForm() {
  const [state, action] = useActionState<FS, FormData>(crearMantenimientoAction, initial);
  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <div className="font-semibold">Cerrar un tramo</div>
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.ok ? <Alert kind="success">Bloqueo creado.</Alert> : null}

      <Field label="Fecha" htmlFor="fecha">
        <TextInput id="fecha" name="fecha" type="date" required />
      </Field>
      <div className="flex gap-3">
        <Field label="Desde" htmlFor="hi">
          <Select id="hi" name="hi" defaultValue="10">
            {INICIO.map((h) => (
              <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
            ))}
          </Select>
        </Field>
        <Field label="Hasta" htmlFor="hf">
          <Select id="hf" name="hf" defaultValue="15">
            {FIN.map((h) => (
              <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Motivo" htmlFor="motivo">
        <TextInput id="motivo" name="motivo" placeholder="Limpieza, pintura…" />
      </Field>
      <SubmitButton>Crear bloqueo</SubmitButton>
    </form>
  );
}
