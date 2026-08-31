"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updatePasswordAction, type FormState } from "./actions";
import { Field, TextInput, SubmitButton, Alert } from "@/components/ui";

const initial: FormState = {};

export default function NewPasswordForm() {
  const t = useTranslations("auth.newPassword");
  const [state, action] = useActionState(updatePasswordAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">

      {state.error ? <Alert>{state.error}</Alert> : null}

      <Field label={t("password")} htmlFor="password">
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>

      <Field label={t("confirm")} htmlFor="confirm">
        <TextInput
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>

      <SubmitButton>{t("submit")}</SubmitButton>
    </form>
  );
}
