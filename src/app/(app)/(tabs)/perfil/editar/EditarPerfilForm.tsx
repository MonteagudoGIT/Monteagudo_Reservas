"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("editProfile");
  const [state, action] = useActionState(guardarPerfilAction, initial);

  return (
    <form action={action} className="flex flex-col gap-3">
      {state.error ? <Alert>{state.error}</Alert> : null}

      <Field label={t("firstName")} htmlFor="nombre">
        <TextInput id="nombre" name="nombre" defaultValue={nombre} autoComplete="given-name" required />
      </Field>
      <Field label={t("lastName")} htmlFor="apellidos">
        <TextInput id="apellidos" name="apellidos" defaultValue={apellidos} autoComplete="family-name" required />
      </Field>

      <Field label={t("phone")} htmlFor="telefono" hint={t("phoneHint")}>
        <TextInput id="telefono" name="telefono" defaultValue={telefono} type="tel" autoComplete="tel" inputMode="tel" />
      </Field>

      <div className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-ink-3">{t("email")}</span>
          <span className="truncate font-medium">{email}</span>
        </div>
        <div className="mt-1.5 flex justify-between gap-3">
          <span className="text-ink-3">{t("home")}</span>
          <span className="font-medium">{vivienda}</span>
        </div>
        <p className="mt-2 text-xs text-ink-3">{t("homeHint")}</p>
      </div>

      <SubmitButton className="mt-1">{t("save")}</SubmitButton>
    </form>
  );
}
