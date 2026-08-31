"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean };

export async function crearSugerenciaAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const t = await getTranslations("sugerencias");
  const texto = String(fd.get("texto") ?? "").trim();
  if (texto.length < 3) return { error: t("required") };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("required") };

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("vivienda_id")
    .eq("id", user.id)
    .single();

  const { error } = await supabase.from("sugerencias").insert({
    usuario_id: user.id,
    vivienda_id: perfil?.vivienda_id ?? null,
    texto,
  });
  if (error) return { error: t("required") };

  revalidatePath("/sugerencias");
  revalidatePath("/admin", "layout");
  return { ok: true };
}
