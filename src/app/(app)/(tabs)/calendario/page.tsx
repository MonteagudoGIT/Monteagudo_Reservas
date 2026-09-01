import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { hoyMadridISO, nombreCorto } from "@/lib/reservas";
import CalendarioCliente from "./CalendarioCliente";

function addDaysISO(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export default async function Page() {
  const session = await getSessionUser();
  const supabase = await createClient();

  const hoy = hoyMadridISO();
  const desde = addDaysISO(hoy, -3);
  const hasta = addDaysISO(hoy, 45);

  const miVivienda = session!.perfil!.vivienda_id ?? "";
  const esAdmin = session!.perfil!.rol === "admin";

  const perfilesQuery = esAdmin
    ? supabase.from("perfiles").select("id, nombre, apellidos")
    : supabase.from("perfiles").select("id, nombre, apellidos").eq("vivienda_id", miVivienda);

  const [{ data: reservas }, { data: mant }, { data: viviendas }, { data: convivientes }] =
    await Promise.all([
      supabase
        .from("reservas")
        .select("id, modo, fecha, inicio, fin, vivienda_id, usuario_id, estado, aprobacion")
        .gte("fecha", desde)
        .lte("fecha", hasta)
        .in("estado", ["retenida", "confirmada", "completada"])
        .neq("aprobacion", "rechazada"),
      supabase.from("bloqueos_mantenimiento").select("inicio, fin, motivo"),
      supabase.from("viviendas").select("id, etiqueta"),
      perfilesQuery,
    ]);

  const etiquetas: Record<string, string> = {};
  for (const v of viviendas ?? []) etiquetas[v.id] = v.etiqueta;

  const nombres: Record<string, string> = {};
  for (const p of convivientes ?? []) {
    nombres[p.id] = nombreCorto(p.nombre, p.apellidos);
  }

  return (
    <CalendarioCliente
      reservas={reservas ?? []}
      mantenimiento={mant ?? []}
      miVivienda={miVivienda}
      etiquetas={etiquetas}
      nombres={nombres}
      verNombres={esAdmin}
      hoy={hoy}
    />
  );
}

export const dynamic = "force-dynamic";
