"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { completarPerfilAction, type FormState } from "./actions";
import { Field, TextInput, Select, SubmitButton, Alert } from "@/components/ui";

const initial: FormState = {};

type Vivienda = { id: string; etiqueta: string };

export default function CompletarPerfilForm({
  viviendas,
  nombre,
  apellidos,
}: {
  viviendas: Vivienda[];
  nombre: string;
  apellidos: string;
}) {
  const t = useTranslations("auth.completeProfile");
  const [state, action] = useActionState(completarPerfilAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-ink-2">{t("subtitle")}</p>
      </div>

      {state.error ? <Alert>{state.error}</Alert> : null}

      <div className="flex gap-3">
        <Field label={t("firstName")} htmlFor="nombre">
          <TextInput
            id="nombre"
            name="nombre"
            defaultValue={nombre}
            autoComplete="given-name"
            required
          />
        </Field>
        <Field label={t("lastName")} htmlFor="apellidos">
          <TextInput
            id="apellidos"
            name="apellidos"
            defaultValue={apellidos}
            autoComplete="family-name"
            required
          />
        </Field>
      </div>

      <Field label={t("home")} htmlFor="vivienda_id">
        <Select id="vivienda_id" name="vivienda_id" defaultValue="" required>
          <option value="" disabled>
            {t("homePlaceholder")}
          </option>
          {viviendas.map((v) => (
            <option key={v.id} value={v.id}>
              {v.etiqueta}
            </option>
          ))}
        </Select>
      </Field>

      <SubmitButton>{t("submit")}</SubmitButton>
    </form>
  );
}
