import { createClient } from "@/lib/supabase/server";
import { formatoEuros } from "@/lib/reservas";
import { nombresDe } from "@/lib/nombres";
import { VolverPanel, AccionBtn } from "@/components/admin-ui";
import { validarTransferencia, cancelarReservaAdmin } from "../actions";

const MODO: Record<string, string> = { sala: "Sala", ping_pong: "Ping Pong" };

function cuando(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reservas")
    .select("id, modo, inicio, fin, importe_cent, referencia_transferencia, retenida_hasta, vivienda_id, usuario_id, viviendas(etiqueta)")
    .eq("estado", "retenida")
    .eq("metodo_pago", "transferencia")
    .order("retenida_hasta", { ascending: true });

  const nombres = await nombresDe(supabase, data);

  return (
    <div>
      <VolverPanel />
      <h1 className="text-xl font-semibold">Transferencias por validar</h1>
      <p className="mt-1 text-sm text-ink-2">
        Marca el ingreso como recibido para confirmar la reserva. Sin validar en 3 días, el hueco se libera.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {(data ?? []).length === 0 && (
          <p className="rounded-xl border border-line bg-surface px-4 py-4 text-sm text-ink-3">
            No hay transferencias pendientes.
          </p>
        )}
        {(data ?? []).map((r) => {
          const viv = Array.isArray(r.viviendas) ? r.viviendas[0] : r.viviendas;
          const quien = r.usuario_id ? nombres[r.usuario_id] : "";
          return (
            <div key={r.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {MODO[r.modo]} · {viv?.etiqueta ?? "—"}
                  {quien ? ` · ${quien}` : ""}
                </span>
                <span className="font-mono font-semibold">{formatoEuros(r.importe_cent)}</span>
              </div>
              <div className="mt-1 text-sm text-ink-2">{cuando(r.inicio)}</div>
              <div className="mt-1 font-mono text-xs text-ink-3">
                Concepto: {r.referencia_transferencia ?? `MTG-${r.id.slice(0, 6)}`}
                {r.retenida_hasta ? ` · caduca ${cuando(r.retenida_hasta)}` : ""}
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <AccionBtn action={cancelarReservaAdmin.bind(null, r.id)} variant="ghost">
                  Anular
                </AccionBtn>
                <AccionBtn action={validarTransferencia.bind(null, r.id)}>Marcar recibida</AccionBtn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
