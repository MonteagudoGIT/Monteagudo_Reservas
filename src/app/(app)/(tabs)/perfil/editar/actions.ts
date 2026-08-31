"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string };

export async function guardarPerfilAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const nombre = String(fd.get("nombre") ?? "").trim();
  const apellidos = String(fd.get("apellidos") ?? "").trim();
  const telefono = String(fd.get("telefono") ?? "").trim() || null;

  if (!nombre || !apellidos) return { error: "El nombre y los apellidos son obligatorios." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { error } = await supabase
    .from("perfiles")
    .update({ nombre, apellidos, telefono })
    .eq("id", user.id);

  if (error) return { error: "No se ha podido guardar. Inténtalo de nuevo." };

  revalidatePath("/perfil");
  revalidatePath("/");
  redirect("/perfil");
}
