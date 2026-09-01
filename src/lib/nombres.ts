import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { nombreCorto } from "./reservas";

type ConUsuario = { usuario_id?: string | null } | null | undefined;

/** Mapa usuario_id -> "Nombre A." para un conjunto de reservas. */
export async function nombresDe(
  supabase: SupabaseClient,
  rows: ConUsuario[] | null | undefined,
): Promise<Record<string, string>> {
  const ids = [
    ...new Set((rows ?? []).map((r) => r?.usuario_id).filter(Boolean)),
  ] as string[];
  if (ids.length === 0) return {};
  const { data } = await supabase
    .from("perfiles")
    .select("id, nombre, apellidos")
    .in("id", ids);
  const out: Record<string, string> = {};
  for (const p of data ?? []) out[p.id as string] = nombreCorto(p.nombre, p.apellidos);
  return out;
}
