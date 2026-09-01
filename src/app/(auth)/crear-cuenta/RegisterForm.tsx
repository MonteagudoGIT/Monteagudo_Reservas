"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { registerAction, type FormState } from "../actions";
import { Field, TextInput, Select, SubmitButton, Alert, Divider } from "@/components/ui";
import GoogleButton from "@/components/GoogleButton";

const initial: FormState = {};

type Vivienda = { id: string; etiqueta: string };

export default function RegisterForm({ viviendas }: { viviendas: Vivienda[] }) {
  const t = useTranslations("auth.register");
  const tAuth = useTranslations("auth");
  const [state, action] = useActionState(registerAction, initial);

  return (
    <form action={action} className="mx-auto flex h-full w-full max-w-md flex-col">
      <header className="flex shrink-0 items-center gap-2 px-5 pb-3 pt-5">
        <Link
          href="/entrar"
          aria-label={t("back")}
          className="-ml-1.5 flex size-9 items-center justify-center rounded-lg text-ink-2"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
      </header>

      <div className="scroll-area min-h-0 flex-1 space-y-4 px-5 py-3">
        <p className="text-sm text-ink-2">{t("hint")}</p>

        {state.error ? <Alert>{state.error}</Alert> : null}

        <GoogleButton />
        <Divider label={tAuth("or")} />

        <div className="flex flex-col gap-4">
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
      </div>

      <footer className="shrink-0 space-y-2 border-t border-line px-5 pb-5 pt-3">
        <SubmitButton>{t("submit")}</SubmitButton>
        <p className="text-center text-sm text-ink-2">
          {t("haveAccount")}{" "}
          <Link href="/entrar" className="font-semibold text-accent-ink">
            {t("login")}
          </Link>
        </p>
      </footer>
    </form>
  );
}
