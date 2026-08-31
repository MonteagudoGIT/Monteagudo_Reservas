import { createClient } from "@/lib/supabase/server";
import { VolverPanel, AccionBtn } from "@/components/admin-ui";
import { borrarMantenimiento } from "../actions";
import MantenimientoForm from "./MantenimientoForm";

function rango(inicio: string, fin: string) {
  const o = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(iso).toLocaleString("es-ES", { timeZone: "Europe/Madrid", ...opts });
  return `${o(inicio, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} – ${o(fin, { hour: "2-digit", minute: "2-digit" })}`;
}

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bloqueos_mantenimiento")
    .select("id, inicio, fin, motivo")
    .gte("fin", new Date().toISOString())
    .order("inicio", { ascending: true });

  return (
    <div>
      <VolverPanel />
      <h1 className="text-xl font-semibold">Mantenimiento</h1>
      <p className="mt-1 text-sm text-ink-2">
        Cierra tramos de la sala. No son reservas y nadie puede reservar encima.
      </p>

      <div className="mt-4">
        <MantenimientoForm />
      </div>

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-[.09em] text-ink-3">Próximos bloqueos</h2>
      <div className="mt-2 flex flex-col gap-2">
        {(data ?? []).length === 0 && <p className="text-sm text-ink-3">Ninguno.</p>}
        {(data ?? []).map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm">
            <span>
              <span className="font-semibold capitalize">{rango(b.inicio, b.fin)}</span>
              {b.motivo ? <span className="text-ink-3"> · {b.motivo}</span> : null}
            </span>
            <AccionBtn action={borrarMantenimiento.bind(null, b.id)} variant="ghost">
              Quitar
            </AccionBtn>
          </div>
        ))}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
