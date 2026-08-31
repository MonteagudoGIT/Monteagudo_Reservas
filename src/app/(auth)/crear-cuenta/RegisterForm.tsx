"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { registerAction, type FormState } from "../actions";
import { Field, TextInput, Select, SubmitButton, Alert } from "@/components/ui";

const initial: FormState = {};

type Vivienda = { id: string; etiqueta: string };

export default function RegisterForm({ viviendas }: { viviendas: Vivienda[] }) {
  const t = useTranslations("auth.register");
  const [state, action] = useActionState(registerAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-ink-2">{t("hint")}</p>
      </div>

      {state.error ? <Alert>{state.error}</Alert> : null}

      <div className="flex gap-3">
        <Field label={t("firstName")} htmlFor="nombre">
          <TextInput id="nombre" name="nombre" autoComplete="given-name" required />
        </Field>
        <Field label={t("lastName")} htmlFor="apellidos">
          <TextInput
            id="apellidos"
            name="apellidos"
            autoComplete="family-name"
            required
          />
        </Field>
      </div>

      <Field label={t("email")} htmlFor="email">
        <TextInput id="email" name="email" type="email" autoComplete="email" required />
      </Field>

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

      <Field label={t("password")} htmlFor="password" hint={t("passwordHint")}>
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>

      <label className="flex items-start gap-2 text-xs text-ink-2">
        <input
          type="checkbox"
          name="acepta"
          required
          className="mt-0.5 size-4"
          style={{ accentColor: "var(--accent)" }}
        />
        {t("accept")}
      </label>

      <SubmitButton>{t("submit")}</SubmitButton>

      <p className="mt-2 text-center text-sm text-ink-2">
        {t("haveAccount")}{" "}
        <Link href="/entrar" className="font-semibold text-accent-ink">
          {t("login")}
        </Link>
      </p>
    </form>
  );
}
