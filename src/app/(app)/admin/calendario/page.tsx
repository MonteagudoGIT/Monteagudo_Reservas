import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { hoyMadridISO, nombreCorto } from "@/lib/reservas";
import { VolverPanel } from "@/components/admin-ui";
import CalendarioCliente from "@/app/(app)/(tabs)/calendario/CalendarioCliente";

function addDaysISO(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export default async function Page() {
  const session = await getSessionUser();
  const supabase = await createClient();
  const hoy = hoyMadridISO();

  const [{ data: reservas }, { data: mant }, { data: viviendas }, { data: perfiles }] =
    await Promise.all([
      supabase
        .from("reservas")
        .select("id, modo, fecha, inicio, fin, vivienda_id, usuario_id, estado, aprobacion")
        .gte("fecha", addDaysISO(hoy, -30))
        .lte("fecha", addDaysISO(hoy, 45))
        .in("estado", ["retenida", "confirmada", "completada"])
        .neq("aprobacion", "rechazada"),
      supabase.from("bloqueos_mantenimiento").select("inicio, fin, motivo"),
      supabase.from("viviendas").select("id, etiqueta"),
      supabase.from("perfiles").select("id, nombre, apellidos"),
    ]);

  const etiquetas: Record<string, string> = {};
  for (const v of viviendas ?? []) etiquetas[v.id] = v.etiqueta;
  const nombres: Record<string, string> = {};
  for (const p of perfiles ?? []) nombres[p.id] = nombreCorto(p.nombre, p.apellidos);

  return (
    <div className="flex h-full flex-col">
      <VolverPanel />
      <div className="-mx-5 -mb-5 min-h-0 flex-1">
        <CalendarioCliente
          reservas={reservas ?? []}
          mantenimiento={mant ?? []}
          miVivienda={session!.perfil!.vivienda_id ?? ""}
          etiquetas={etiquetas}
          nombres={nombres}
          verNombres
          hoy={hoy}
        />
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
