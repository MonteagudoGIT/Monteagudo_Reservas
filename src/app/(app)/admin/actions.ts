"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type R = { error?: string };
type FS = { error?: string; ok?: boolean };

function codigo(msg: string) {
  return (msg.match(/[A-Z_]{3,}/) ?? [])[0] ?? "";
}
function refrescoAdmin() {
  revalidatePath("/admin", "layout");
}

async function llamarRpc(name: string, args: object, map: Record<string, string> = {}): Promise<R> {
  const s = await createClient();
  const { error } = await s.rpc(name, args);
  if (error) return { error: map[codigo(error.message)] ?? "Ha ocurrido un error." };
  refrescoAdmin();
  return {};
}

export async function validarTransferencia(id: string): Promise<R> {
  return llamarRpc("validar_transferencia", { p_id: id }, { ESTADO: "La reserva ya no está retenida." });
}

export async function aprobarReserva(id: string): Promise<R> {
  return llamarRpc("aprobar_reserva", { p_id: id }, { ESTADO: "Ya no está pendiente de aprobación." });
}

export async function rechazarReserva(id: string): Promise<R> {
  return llamarRpc("rechazar_reserva", { p_id: id, p_motivo: null }, { ESTADO: "Ya no está pendiente." });
}

export async function cancelarReservaAdmin(id: string): Promise<R> {
  return llamarRpc(
    "cancelar_reserva",
    { p_id: id, p_motivo: "Cancelada por administración" },
    { ESTADO: "No se puede cancelar." },
  );
}

export async function bloquearVivienda(id: string, motivo: string): Promise<R> {
  const s = await createClient();
  const { error } = await s
    .from("viviendas")
    .update({
      bloqueada: true,
      motivo_bloqueo: motivo.trim() || "Impago de cuota",
      bloqueada_en: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: "No se ha podido bloquear." };
  refrescoAdmin();
  revalidatePath("/reservar");
  return {};
}

export async function desbloquearVivienda(id: string): Promise<R> {
  const s = await createClient();
  const { error } = await s
    .from("viviendas")
    .update({ bloqueada: false, motivo_bloqueo: null, bloqueada_en: null })
    .eq("id", id);
  if (error) return { error: "No se ha podido desbloquear." };
  refrescoAdmin();
  revalidatePath("/reservar");
  return {};
}

export async function setEstadoUsuario(id: string, estado: "activa" | "desactivada"): Promise<R> {
  const s = await createClient();
  const { error } = await s.from("perfiles").update({ estado }).eq("id", id);
  if (error) return { error: "No se ha podido cambiar el estado." };
  refrescoAdmin();
  return {};
}

export async function setEstadoSugerencia(
  id: string,
  estado: "nueva" | "leida" | "gestionada",
): Promise<R> {
  const s = await createClient();
  const { error } = await s.from("sugerencias").update({ estado }).eq("id", id);
  if (error) return { error: "No se ha podido actualizar." };
  refrescoAdmin();
  return {};
}

export async function borrarMantenimiento(id: string): Promise<R> {
  const s = await createClient();
  const { error } = await s.from("bloqueos_mantenimiento").delete().eq("id", id);
  if (error) return { error: "No se ha podido borrar." };
  refrescoAdmin();
  revalidatePath("/calendario");
  return {};
}

export async function publicarAviso(id: string, publicado: boolean): Promise<R> {
  const s = await createClient();
  const { error } = await s
    .from("avisos")
    .update({
      publicado,
      publicado_en: publicado ? new Date().toISOString() : null,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: "No se ha podido cambiar." };
  refrescoAdmin();
  revalidatePath("/");
  return {};
}

export async function borrarAviso(id: string): Promise<R> {
  const s = await createClient();
  const { error } = await s.from("avisos").delete().eq("id", id);
  if (error) return { error: "No se ha podido borrar." };
  refrescoAdmin();
  revalidatePath("/");
  return {};
}

// -------- Formularios --------

export async function guardarTarifasAction(_p: FS, fd: FormData): Promise<FS> {
  const s = await createClient();
  const sala = Math.round(Number(String(fd.get("sala") ?? "").replace(",", ".")) * 100);
  const ping = Math.round(Number(String(fd.get("ping_pong") ?? "").replace(",", ".")) * 100);
  if (!Number.isFinite(sala) || !Number.isFinite(ping) || sala < 0 || ping < 0) {
    return { error: "Precios no válidos." };
  }
  const antSala = Math.round(Number(fd.get("ant_sala")));
  const antPing = Math.round(Number(fd.get("ant_ping")));
  if (![antSala, antPing].every((n) => Number.isFinite(n) && n >= 1 && n <= 120)) {
    return { error: "La antelación debe estar entre 1 y 120 días." };
  }
  const { data: esp } = await s.from("espacios").select("id").eq("clave", "sala").single();
  const now = new Date().toISOString();
  const { error } = await s.from("tarifas").upsert(
    [
      { espacio_id: esp!.id, modo: "sala", precio_cent: sala, requiere_aprobacion: fd.get("req_sala") === "on", dias_antelacion: antSala, actualizado_en: now },
      { espacio_id: esp!.id, modo: "ping_pong", precio_cent: ping, requiere_aprobacion: fd.get("req_ping") === "on", dias_antelacion: antPing, actualizado_en: now },
    ],
    { onConflict: "espacio_id,modo" },
  );
  if (error) return { error: "No se ha podido guardar." };
  revalidatePath("/admin/espacio");
  revalidatePath("/reservar");
  return { ok: true };
}

export async function guardarFichaAction(_p: FS, fd: FormData): Promise<FS> {
  const s = await createClient();
  const aforoRaw = String(fd.get("aforo") ?? "").trim();
  const aforo = aforoRaw ? Number(aforoRaw) : null;
  const equipamiento = String(fd.get("equipamiento") ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const normas = String(fd.get("normas") ?? "").trim() || null;
  const { error } = await s.from("espacios").update({ aforo, equipamiento, normas }).eq("clave", "sala");
  if (error) return { error: "No se ha podido guardar." };
  revalidatePath("/admin/espacio");
  return { ok: true };
}

export async function guardarPagoAction(_p: FS, fd: FormData): Promise<FS> {
  const s = await createClient();
  const iban = String(fd.get("iban") ?? "").trim().replace(/\s+/g, " ") || null;
  const titular = String(fd.get("titular_cuenta") ?? "").trim() || null;
  const concepto = String(fd.get("concepto_pago") ?? "").trim() || null;
  const { error } = await s
    .from("espacios")
    .update({ iban, titular_cuenta: titular, concepto_pago: concepto })
    .eq("clave", "sala");
  if (error) return { error: "No se ha podido guardar." };
  revalidatePath("/admin/espacio");
  return { ok: true };
}

export async function crearMantenimientoAction(_p: FS, fd: FormData): Promise<FS> {
  const s = await createClient();
  const fecha = String(fd.get("fecha") ?? "");
  const hi = Number(fd.get("hi"));
  const hf = Number(fd.get("hf"));
  const motivo = String(fd.get("motivo") ?? "").trim() || null;
  if (!fecha || !(hf > hi)) return { error: "Revisa la fecha y las horas." };
  const { data: esp } = await s.from("espacios").select("id").eq("clave", "sala").single();
  const { error } = await s.rpc("crear_mantenimiento", {
    p_espacio: esp!.id,
    p_fecha: fecha,
    p_hi: hi,
    p_hf: hf,
    p_motivo: motivo,
  });
  if (error) return { error: "No se ha podido crear el bloqueo." };
  revalidatePath("/admin/mantenimiento");
  revalidatePath("/calendario");
  return { ok: true };
}

export async function crearAvisoAction(_p: FS, fd: FormData): Promise<FS> {
  const s = await createClient();
  const titulo = String(fd.get("titulo") ?? "").trim();
  const cuerpo = String(fd.get("cuerpo") ?? "").trim();
  if (titulo.length < 2 || cuerpo.length < 2) return { error: "El título y el texto son obligatorios." };
  const publicar = fd.get("publicar") === "on";
  const enviarCorreo = publicar && fd.get("enviar_email") === "on";

  const { data: nuevo, error } = await s
    .from("avisos")
    .insert({
      titulo,
      cuerpo,
      publicado: publicar,
      publicado_en: publicar ? new Date().toISOString() : null,
      enviar_email: enviarCorreo,
    })
    .select("id")
    .single();
  if (error) return { error: "No se ha podido crear el aviso." };

  if (enviarCorreo && nuevo) {
    const { enviarAviso } = await import("@/lib/avisos-mail");
    after(() => enviarAviso(nuevo.id as string));
  }

  revalidatePath("/admin/avisos");
  revalidatePath("/");
  redirect("/admin/avisos");
}

export async function reservaAsistidaAction(_p: FS, fd: FormData): Promise<FS> {
  const s = await createClient();
  const modo = String(fd.get("modo"));
  const fecha = String(fd.get("fecha"));
  const hi = Number(fd.get("hi"));
  const hf = Number(fd.get("hf"));
  const vivienda = String(fd.get("vivienda_id"));
  const tipo = fd.get("junta") === "on" ? "junta" : "normal";
  if (!vivienda || !fecha || !(hf > hi)) return { error: "Revisa los datos." };

  const { data, error } = await s.rpc("crear_reserva", {
    p_modo: modo,
    p_fecha: fecha,
    p_hi: hi,
    p_hf: hf,
    p_metodo: "gestion_admin",
    p_vivienda: vivienda,
    p_tipo: tipo,
  });
  if (error) {
    const m: Record<string, string> = {
      IMPAGO: "Esa vivienda está en impago; no se puede reservar.",
      OCUPADO: "Ese tramo ya está ocupado.",
      MANTENIMIENTO: "Ese tramo está cerrado por mantenimiento.",
      HORARIO: "Horario no válido.",
      FECHA: "Fecha fuera de rango (máx. 7 días).",
      PASADO: "Esa hora ya ha pasado.",
      JUNTA_SOLO_SALA: "La reserva de junta solo aplica a la Sala.",
    };
    return { error: m[codigo(error.message)] ?? "No se ha podido crear la reserva." };
  }
  revalidatePath("/admin/reservas");
  redirect(`/reserva/${data as string}`);
}
