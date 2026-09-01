"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { loginAction, type FormState } from "../actions";
import { Field, TextInput, SubmitButton, Alert, Divider } from "@/components/ui";
import GoogleButton from "@/components/GoogleButton";

const initial: FormState = {};

export default function LoginForm() {
  const t = useTranslations("auth.login");
  const tAuth = useTranslations("auth");
  const [state, action] = useActionState(loginAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-ink-2">{t("subtitle")}</p>
      </div>

      {state.error ? <Alert>{state.error}</Alert> : null}

      <GoogleButton />
      <Divider label={tAuth("or")} />

      <Field label={t("email")} htmlFor="email">
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </Field>

      <Field label={t("password")} htmlFor="password">
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-ink-2">
          <input
            type="checkbox"
            name="remember"
            defaultChecked
            className="size-4"
            style={{ accentColor: "var(--accent)" }}
          />
          {t("remember")}
        </label>
        <Link
          href="/recuperar"
          className="text-sm font-semibold text-accent-ink"
        >
          {t("forgot")}
        </Link>
      </div>

      <SubmitButton>{t("submit")}</SubmitButton>

      <p className="mt-2 text-center text-sm text-ink-2">
        {t("noAccount")}{" "}
        <Link href="/crear-cuenta" className="font-semibold text-accent-ink">
          {t("createAccount")}
        </Link>
      </p>
    </form>
  );
}
