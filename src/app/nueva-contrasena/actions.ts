"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string };

export async function updatePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations("auth.newPassword");
  const tErr = await getTranslations("auth.errors");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) return { error: t("tooShort") };
  if (password !== confirm) return { error: t("mismatch") };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/recuperar");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: tErr("generic") };

  redirect("/");
}
