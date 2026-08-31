"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string };

export async function guardarPerfilAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const t = await getTranslations("editProfile");
  const nombre = String(fd.get("nombre") ?? "").trim();
  const apellidos = String(fd.get("apellidos") ?? "").trim();
  const telefono = String(fd.get("telefono") ?? "").trim() || null;

  if (!nombre || !apellidos) return { error: t("required") };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { error } = await supabase
    .from("perfiles")
    .update({ nombre, apellidos, telefono })
    .eq("id", user.id);

  if (error) return { error: t("failed") };

  revalidatePath("/perfil");
  revalidatePath("/");
  redirect("/perfil");
}
