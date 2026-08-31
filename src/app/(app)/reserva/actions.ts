"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export async function cancelarReservaAction(
  id: string,
): Promise<{ error?: string; ok?: boolean }> {
  const t = await getTranslations("reservaDetalle");
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancelar_reserva", { p_id: id, p_motivo: null });

  if (error) {
    const code = (error.message.match(/[A-Z_]{3,}/) ?? [])[0] ?? "";
    const map: Record<string, string> = {
      TARDE: t("err_tarde"),
      NO_PERMISO: t("err_noPermiso"),
      ESTADO: t("err_estado"),
    };
    return { error: map[code] ?? t("err_generic") };
  }

  revalidatePath("/mis-reservas");
  revalidatePath(`/reserva/${id}`);
  revalidatePath("/");
  return { ok: true };
}
