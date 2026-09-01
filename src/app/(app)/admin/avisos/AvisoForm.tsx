"use client";

import { useActionState } from "react";
import { crearAvisoAction } from "../actions";
import { Field, TextInput, Textarea, SubmitButton, Alert } from "@/components/ui";

type FS = { error?: string; ok?: boolean };
const initial: FS = {};

export default function AvisoForm() {
  const [state, action] = useActionState<FS, FormData>(crearAvisoAction, initial);
  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <div className="font-semibold">Nuevo aviso</div>
      {state.error ? <Alert>{state.error}</Alert> : null}
      <Field label="Título" htmlFor="titulo">
        <TextInput id="titulo" name="titulo" required />
      </Field>
      <Field label="Texto" htmlFor="cuerpo">
        <Textarea id="cuerpo" name="cuerpo" required />
      </Field>
      <label className="flex items-center gap-2 text-sm text-ink-2">
        <input type="checkbox" name="publicar" defaultChecked className="size-4" style={{ accentColor: "var(--accent)" }} />
        Publicar ya (visible para los vecinos)
      </label>
      <label className="flex items-start gap-2 text-sm text-ink-2">
        <input type="checkbox" name="enviar_email" className="mt-0.5 size-4" style={{ accentColor: "var(--accent)" }} />
        <span>
          Enviar también por correo a los vecinos
          <span className="block text-xs text-ink-3">
            Solo si se publica. Tarda ~1 min y algunos pueden llegar a spam.
          </span>
        </span>
      </label>
      <SubmitButton>Crear aviso</SubmitButton>
    </form>
  );
}
