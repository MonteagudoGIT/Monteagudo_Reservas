"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { horaMadrid } from "@/lib/reservas";

const MSG: Record<string, string> = {
  IMPAGO: "Tu vivienda está bloqueada por impago. Contacta con el administrador.",
  FECHA: "Solo se puede reservar hasta 7 días vista.",
  HORARIO: "Ese horario no es válido.",
  PASADO: "Esa hora ya ha pasado.",
  SALDO: "No hay saldo suficiente para pagar así.",
  OCUPADO: "Ese tramo acaba de ocuparse. Elige otro.",
  MANTENIMIENTO: "Ese tramo está cerrado por mantenimiento.",
  JUNTA_SOLO_SALA: "La reserva para junta solo aplica a la Sala.",
  SIN_VIVIENDA: "Tu cuenta no tiene vivienda asignada.",
  NO_ADMIN: "Acción reservada al administrador.",
};

export type CrearState = { error?: string };

export async function crearReservaAction(
  _prev: CrearState,
  fd: FormData,
): Promise<CrearState> {
  const modo = String(fd.get("modo"));
  const fecha = String(fd.get("fecha"));
  const hi = Number(fd.get("hi"));
  const hf = Number(fd.get("hf"));
  const metodo = String(fd.get("metodo"));

  if (!["sala", "ping_pong"].includes(modo) || !fecha || !Number.isInteger(hi) || !Number.isInteger(hf)) {
    return { error: "Revisa la selección." };
  }
  if (!["transferencia", "saldo"].includes(metodo)) {
    return { error: "Elige un método de pago." };
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
    return { error: MSG[code] ?? "No se ha podido crear la reserva." };
  }

  redirect(`/reserva/${data as string}?nueva=1`);
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
