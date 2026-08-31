import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { hoyMadridISO } from "@/lib/reservas";
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

  const [{ data: reservas }, { data: mant }] = await Promise.all([
    supabase
      .from("reservas")
      .select("id, modo, fecha, inicio, fin, vivienda_id, estado, aprobacion")
      .gte("fecha", desde)
      .lte("fecha", hasta)
      .in("estado", ["retenida", "confirmada", "completada"])
      .neq("aprobacion", "rechazada"),
    supabase.from("bloqueos_mantenimiento").select("inicio, fin, motivo"),
  ]);

  return (
    <CalendarioCliente
      reservas={reservas ?? []}
      mantenimiento={mant ?? []}
      miVivienda={session!.perfil!.vivienda_id ?? ""}
      hoy={hoy}
    />
  );
}

export const dynamic = "force-dynamic";
