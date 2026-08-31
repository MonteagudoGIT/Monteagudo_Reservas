"use client";

import { useActionState } from "react";
import { guardarPerfilAction, type FormState } from "./actions";
import { Field, TextInput, SubmitButton, Alert } from "@/components/ui";

const initial: FormState = {};

export default function EditarPerfilForm({
  nombre,
  apellidos,
  telefono,
  email,
  vivienda,
}: {
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string;
  vivienda: string;
}) {
  const [state, action] = useActionState(guardarPerfilAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error ? <Alert>{state.error}</Alert> : null}

      <div className="flex gap-3">
        <Field label="Nombre" htmlFor="nombre">
          <TextInput id="nombre" name="nombre" defaultValue={nombre} autoComplete="given-name" required />
        </Field>
        <Field label="Apellidos" htmlFor="apellidos">
          <TextInput id="apellidos" name="apellidos" defaultValue={apellidos} autoComplete="family-name" required />
        </Field>
      </div>

      <Field label="Teléfono" htmlFor="telefono" hint="Opcional. Para avisos y contacto.">
        <TextInput id="telefono" name="telefono" defaultValue={telefono} type="tel" autoComplete="tel" inputMode="tel" />
      </Field>

      <Field label="Email" htmlFor="email" hint="El email no se puede cambiar desde aquí.">
        <TextInput id="email" value={email} disabled />
      </Field>

      <Field label="Vivienda" htmlFor="vivienda" hint="Para cambiar de vivienda, contacta con el administrador.">
        <TextInput id="vivienda" value={vivienda} disabled />
      </Field>

      <SubmitButton className="mt-2">Guardar</SubmitButton>
    </form>
  );
}
