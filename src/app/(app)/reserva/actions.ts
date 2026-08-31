"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MSG: Record<string, string> = {
  TARDE: "Ya no se puede cancelar: falta menos de una hora para empezar.",
  NO_PERMISO: "No puedes cancelar esta reserva.",
  ESTADO: "Esta reserva ya no se puede cancelar.",
};

export async function cancelarReservaAction(
  id: string,
): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancelar_reserva", { p_id: id, p_motivo: null });

  if (error) {
    const code = (error.message.match(/[A-Z_]{3,}/) ?? [])[0] ?? "";
    return { error: MSG[code] ?? "No se ha podido cancelar." };
  }

  revalidatePath("/mis-reservas");
  revalidatePath(`/reserva/${id}`);
  revalidatePath("/");
  return { ok: true };
}
