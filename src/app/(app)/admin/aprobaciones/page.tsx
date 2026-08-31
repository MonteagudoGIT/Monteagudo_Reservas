import { createClient } from "@/lib/supabase/server";
import { VolverPanel, AccionBtn } from "@/components/admin-ui";
import { aprobarReserva, rechazarReserva } from "../actions";

const MODO: Record<string, string> = { sala: "Sala", ping_pong: "Ping Pong" };

function cuando(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reservas")
    .select("id, modo, tipo_reserva, inicio, importe_cent, estado, viviendas(etiqueta)")
    .eq("aprobacion", "pendiente")
    .order("inicio", { ascending: true });

  return (
    <div>
      <VolverPanel />
      <h1 className="text-xl font-semibold">Aprobaciones pendientes</h1>
      <p className="mt-1 text-sm text-ink-2">
        Reservas de Sala que requieren visto bueno, y juntas de vecinos solicitadas por un vecino.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {(data ?? []).length === 0 && (
          <p className="rounded-xl border border-line bg-surface px-4 py-4 text-sm text-ink-3">
            No hay nada pendiente de aprobar.
          </p>
        )}
        {(data ?? []).map((r) => {
          const viv = Array.isArray(r.viviendas) ? r.viviendas[0] : r.viviendas;
          return (
            <div key={r.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="font-semibold">
                {MODO[r.modo]}
                {r.tipo_reserva === "junta" ? " · Junta de vecinos (gratis)" : ""} · {viv?.etiqueta ?? "—"}
              </div>
              <div className="mt-1 text-sm capitalize text-ink-2">{cuando(r.inicio)}</div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <AccionBtn action={rechazarReserva.bind(null, r.id)} variant="danger" confirmText="¿Rechazar esta reserva?">
                  Rechazar
                </AccionBtn>
                <AccionBtn action={aprobarReserva.bind(null, r.id)}>Aprobar</AccionBtn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
