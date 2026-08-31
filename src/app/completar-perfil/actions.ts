"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string };

export async function completarPerfilAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tErr = await getTranslations("auth.errors");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();
  const viviendaId = String(formData.get("vivienda_id") ?? "").trim();

  if (!nombre || !apellidos || !viviendaId) return { error: tErr("generic") };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { error } = await supabase
    .from("perfiles")
    .update({ nombre, apellidos, vivienda_id: viviendaId })
    .eq("id", user.id);

  if (error) return { error: tErr("generic") };

  redirect("/");
}
