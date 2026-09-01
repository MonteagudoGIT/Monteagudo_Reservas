"use client";

import { useActionState } from "react";
import { guardarTarifasAction, guardarFichaAction, guardarPagoAction } from "../actions";
import { Field, TextInput, Textarea, SubmitButton, Alert } from "@/components/ui";

type FS = { error?: string; ok?: boolean };
const initial: FS = {};

export function TarifasForm({
  salaEur,
  pingEur,
  reqSala,
  reqPing,
  antSala,
  antPing,
}: {
  salaEur: string;
  pingEur: string;
  reqSala: boolean;
  reqPing: boolean;
  antSala: string;
  antPing: string;
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

      <div className="flex gap-3">
        <Field label="Antelación Sala (días)" htmlFor="ant_sala">
          <TextInput id="ant_sala" name="ant_sala" defaultValue={antSala} inputMode="numeric" required />
        </Field>
        <Field label="Antelación Ping Pong (días)" htmlFor="ant_ping">
          <TextInput id="ant_ping" name="ant_ping" defaultValue={antPing} inputMode="numeric" required />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-ink-3">Con cuántos días de antelación como máximo se puede reservar (1–120).</p>

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

export function PagoForm({
  iban,
  titular,
  concepto,
}: {
  iban: string;
  titular: string;
  concepto: string;
}) {
  const [state, action] = useActionState<FS, FormData>(guardarPagoAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
      <div className="font-semibold">Datos de pago (transferencia)</div>
      <p className="-mt-2 text-xs text-ink-3">
        Se le muestran al vecino cuando su reserva queda pendiente de pago por transferencia.
      </p>
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.ok ? <Alert kind="success">Guardado.</Alert> : null}

      <Field label="IBAN de la comunidad" htmlFor="iban">
        <TextInput id="iban" name="iban" defaultValue={iban} placeholder="ES00 0000 0000 0000 0000 0000" />
      </Field>
      <Field label="Titular de la cuenta" htmlFor="titular_cuenta">
        <TextInput id="titular_cuenta" name="titular_cuenta" defaultValue={titular} />
      </Field>
      <Field
        label="Concepto sugerido"
        htmlFor="concepto_pago"
        hint="Admite {espacio}, {fecha} y {vivienda}"
      >
        <TextInput id="concepto_pago" name="concepto_pago" defaultValue={concepto} />
      </Field>

      <SubmitButton>Guardar datos de pago</SubmitButton>
    </form>
  );
}
