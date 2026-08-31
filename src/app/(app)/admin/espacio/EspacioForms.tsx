"use client";

import { useActionState } from "react";
import { guardarTarifasAction, guardarFichaAction } from "../actions";
import { Field, TextInput, Textarea, SubmitButton, Alert } from "@/components/ui";

type FS = { error?: string; ok?: boolean };
const initial: FS = {};

export function TarifasForm({
  salaEur,
  pingEur,
  reqSala,
  reqPing,
}: {
  salaEur: string;
  pingEur: string;
  reqSala: boolean;
  reqPing: boolean;
}) {
  const [state, action] = useActionState<FS, FormData>(guardarTarifasAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
      <div className="font-semibold">Tarifas y aprobación</div>
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.ok ? <Alert kind="success">Guardado.</Alert> : null}

      <div className="flex gap-3">
        <Field label="Precio Sala (€)" htmlFor="sala">
          <TextInput id="sala" name="sala" defaultValue={salaEur} inputMode="decimal" required />
        </Field>
        <Field label="Precio Ping Pong (€)" htmlFor="ping_pong">
          <TextInput id="ping_pong" name="ping_pong" defaultValue={pingEur} inputMode="decimal" required />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-2">
        <input type="checkbox" name="req_sala" defaultChecked={reqSala} className="size-4" style={{ accentColor: "var(--accent)" }} />
        Las reservas de Sala requieren mi visto bueno
      </label>
      <label className="flex items-center gap-2 text-sm text-ink-2">
        <input type="checkbox" name="req_ping" defaultChecked={reqPing} className="size-4" style={{ accentColor: "var(--accent)" }} />
        Las reservas de Ping Pong requieren mi visto bueno
      </label>

      <SubmitButton>Guardar tarifas</SubmitButton>
    </form>
  );
}

export function FichaForm({
  aforo,
  equipamiento,
  normas,
}: {
  aforo: string;
  equipamiento: string;
  normas: string;
}) {
  const [state, action] = useActionState<FS, FormData>(guardarFichaAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
      <div className="font-semibold">Ficha de la Sala</div>
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.ok ? <Alert kind="success">Guardado.</Alert> : null}

      <Field label="Aforo máximo" htmlFor="aforo">
        <TextInput id="aforo" name="aforo" defaultValue={aforo} inputMode="numeric" />
      </Field>
      <Field label="Equipamiento" htmlFor="equipamiento" hint="Separado por comas: Mesas, Sillas, Proyector…">
        <TextInput id="equipamiento" name="equipamiento" defaultValue={equipamiento} />
      </Field>
      <Field label="Normas del espacio" htmlFor="normas">
        <Textarea id="normas" name="normas" defaultValue={normas} />
      </Field>

      <SubmitButton>Guardar ficha</SubmitButton>
    </form>
  );
}
