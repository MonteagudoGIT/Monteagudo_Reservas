"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { horaMadrid } from "@/lib/reservas";

const ERR_KEY: Record<string, string> = {
  IMPAGO: "err_impago",
  FECHA: "err_fecha",
  HORARIO: "err_horario",
  PASADO: "err_pasado",
  SALDO: "err_saldo",
  OCUPADO: "err_ocupado",
  MANTENIMIENTO: "err_mantenimiento",
  JUNTA_SOLO_SALA: "err_junta",
  SIN_VIVIENDA: "err_sinVivienda",
  NO_ADMIN: "err_noAdmin",
};

export type CrearState = { error?: string };

export async function crearReservaAction(
  _prev: CrearState,
  fd: FormData,
): Promise<CrearState> {
  const t = await getTranslations("reservar");
  const modo = String(fd.get("modo"));
  const fecha = String(fd.get("fecha"));
  const hi = Number(fd.get("hi"));
  const hf = Number(fd.get("hf"));
  const metodo = String(fd.get("metodo"));

  if (!["sala", "ping_pong"].includes(modo) || !fecha || !Number.isInteger(hi) || !Number.isInteger(hf)) {
    return { error: t("err_seleccion") };
  }
  if (!["transferencia", "saldo"].includes(metodo)) {
    return { error: t("err_metodo") };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("crear_reserva", {
    p_modo: modo,
    p_fecha: fecha,
    p_hi: hi,
    p_hf: hf,
    p_metodo: metodo,
  });

  if (error) {
    const code = (error.message.match(/[A-Z_]{3,}/) ?? [])[0] ?? "";
    return { error: t((ERR_KEY[code] ?? "err_generic") as "err_generic") };
  }

  revalidatePath("/");
  revalidatePath("/mis-reservas");
  revalidatePath("/calendario");
  redirect(`/reserva/${data as string}?nueva=1`);
}

/** Fechas (ISO) entre `desde` y `hasta` con al menos una reserva activa. Para los puntos del calendario. */
export async function diasConReserva(desde: string, hasta: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reservas")
    .select("fecha")
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .in("estado", ["retenida", "confirmada", "completada"])
    .neq("aprobacion", "rechazada");
  return [...new Set((data ?? []).map((r) => r.fecha as string))];
}

/** Horas de inicio (10–22) ya ocupadas ese día por reservas activas o mantenimiento. */
export async function horasOcupadas(fecha: string): Promise<number[]> {
  const supabase = await createClient();

  const [{ data: reservas }, { data: mant }] = await Promise.all([
    supabase
      .from("reservas")
      .select("inicio, fin")
      .eq("fecha", fecha)
      .in("estado", ["retenida", "confirmada", "completada"])
      .neq("aprobacion", "rechazada"),
    supabase
      .from("bloqueos_mantenimiento")
      .select("inicio, fin"),
  ]);

  const set = new Set<number>();
  const marca = (inicioISO: string, finISO: string) => {
    const hi = horaMadrid(inicioISO);
    let hf = horaMadrid(finISO);
    if (hf === 0) hf = 24;
    for (let h = hi; h < hf; h++) set.add(h);
  };

  (reservas ?? []).forEach((r) => marca(r.inicio, r.fin));
  (mant ?? []).forEach((m) => {
    // Solo si el bloqueo cae en ese día (comparamos fecha local Madrid)
    const dISO = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(
      new Date(m.inicio),
    );
    if (dISO === fecha) marca(m.inicio, m.fin);
  });

  return [...set].sort((a, b) => a - b);
}
