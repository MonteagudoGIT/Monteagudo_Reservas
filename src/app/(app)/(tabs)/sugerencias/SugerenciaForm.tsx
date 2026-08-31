"use client";

import { useActionState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { crearSugerenciaAction, type FormState } from "./actions";
import { Textarea, SubmitButton, Alert } from "@/components/ui";

const initial: FormState = {};

export default function SugerenciaForm() {
  const t = useTranslations("sugerencias");
  const [state, action] = useActionState(crearSugerenciaAction, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.ok ? <Alert kind="success">{t("sent")}</Alert> : null}
      <Textarea name="texto" placeholder={t("placeholder")} className="min-h-32" required />
      <SubmitButton>{t("send")}</SubmitButton>
    </form>
  );
}
