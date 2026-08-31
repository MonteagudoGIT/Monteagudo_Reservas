"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { recoverAction, type FormState } from "../actions";
import { Field, TextInput, SubmitButton, Alert } from "@/components/ui";

const initial: FormState = {};

export default function RecoverForm() {
  const t = useTranslations("auth.recover");
  const [state, action] = useActionState(recoverAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-ink-2">{t("body")}</p>
      </div>

      {state.ok ? <Alert kind="success">{t("sent")}</Alert> : null}

      <Field label={t("email")} htmlFor="email">
        <TextInput id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <SubmitButton>{t("submit")}</SubmitButton>

      <Link
        href="/entrar"
        className="mt-2 text-center text-sm font-semibold text-accent-ink"
      >
        {t("back")}
      </Link>
    </form>
  );
}
