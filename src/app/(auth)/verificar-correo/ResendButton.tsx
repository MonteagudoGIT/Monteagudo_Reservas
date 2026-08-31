"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { resendAction, type FormState } from "../actions";
import { SubmitButton, Alert } from "@/components/ui";

const initial: FormState = {};

export default function ResendButton({ email }: { email: string }) {
  const t = useTranslations("auth.verify");
  const [state, action] = useActionState(resendAction, initial);

  return (
    <form action={action} className="flex w-full flex-col gap-2">
      <input type="hidden" name="email" value={email} />
      {state.ok ? <Alert kind="success">{t("resent")}</Alert> : null}
      <SubmitButton variant="secondary" className="w-full">
        {t("resend")}
      </SubmitButton>
    </form>
  );
}
