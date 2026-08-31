import { createClient } from "@/lib/supabase/server";

export type Rol = "usuario" | "admin";
export type EstadoCuenta = "activa" | "desactivada";

export type Perfil = {
  id: string;
  nombre: string;
  apellidos: string;
  telefono: string | null;
  rol: Rol;
  estado: EstadoCuenta;
  vivienda_id: string | null;
  vivienda_texto: string | null;
};

/** Usuario autenticado + su perfil, o null si no hay sesión. */
export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select(
      "id, nombre, apellidos, telefono, rol, estado, vivienda_id, vivienda_texto",
    )
    .eq("id", user.id)
    .single<Perfil>();

  return { user, perfil };
}
